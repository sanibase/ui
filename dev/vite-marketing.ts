/**
 * Dev-only Vite plugin: expose apps/web/public/media/brand-assets as
 * a downloadable asset library for the marketing team.
 *
 * Endpoints (served under the Vite gallery base `/sanidesk/ui/`):
 *
 *   GET /sanidesk/ui/marketing-manifest
 *     Returns JSON describing every file in brand-assets/, grouped into
 *     human-friendly buckets (icons, banners, social, app-store, etc.)
 *     so the page doesn't have to maintain a hand-curated list. Drop a
 *     new PNG into the folder and it shows up on next reload.
 *
 *   GET /sanidesk/ui/marketing-files/<name>
 *     Streams the actual file. The page uses these URLs as both <img src>
 *     and <a download href> targets.
 *
 * Scope = brand-assets only by design (see chat 2026-05-20):
 *   - /icons/ is a frozen 4-file subset wired into the PWA manifest.
 *   - /media/docs/ is German admin screenshots, not marketing material.
 *   - Stock photos live elsewhere and can be added later if needed.
 */

import { promises as fs, createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import type { Plugin } from 'vite';

const BRAND_DIR = '../../../apps/web/public/media/brand-assets';

interface AssetEntry {
  file: string;
  url: string;
  size: number;
  ext: string;
  group: string;
  label: string;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark' | 'neutral';
}

/**
 * Map a filename to a display group + label. Pure string-munging — no
 * filesystem touch — so it stays trivially testable.
 */
function classify(file: string): Pick<AssetEntry, 'group' | 'label' | 'width' | 'height' | 'theme'> {
  // `1920x1080`, `512x512`, or trailing single-int `…-512.png`.
  const dimsMatch = file.match(/(\d+)x(\d+)/);
  const singleMatch = !dimsMatch ? file.match(/-(\d+)\.[a-z]+$/i) : null;
  const width = dimsMatch ? Number(dimsMatch[1]) : singleMatch ? Number(singleMatch[1]) : undefined;
  const height = dimsMatch ? Number(dimsMatch[2]) : singleMatch ? Number(singleMatch[1]) : undefined;

  // "preview on": which backdrop the asset is designed for.
  // - `-dark-` PNGs (android-icon-dark, og-facebook-dark, …) are light-coloured
  //   art that lives on dark mode.
  // - `icon-rounded-white.svg` is also white-on-dark (existing AssetsPage convention).
  // - `-dark.svg` (icon-rounded-dark) is literally dark colouring → light backdrop.
  const isWhiteOnDark = file === 'icon-rounded-white.svg';
  const isDarkVariant = /-dark[-.]/.test(file) && file !== 'icon-rounded-dark.svg';
  const isLight = /-light[-.]/.test(file);
  const theme: AssetEntry['theme'] = (isDarkVariant || isWhiteOnDark) ? 'dark' : isLight ? 'light' : 'neutral';

  // "Selling point" variants — rich-content cards rendered from
  // og-templates/selling-point.html. Kept in dedicated groups so the
  // blank logo-only versions stay easy to find.
  if (file.startsWith('sp-banner-')) {
    return {
      group: 'Banners (Selling Point)',
      label: `${theme === 'dark' ? 'Dark' : 'Light'} ${width && height ? `${width}x${height}` : ''}`.trim(),
      width, height, theme,
    };
  }
  if (file.startsWith('sp-og-')) {
    const platform = file.split('-')[2] ?? '';
    return {
      group: 'Social / OG (Selling Point)',
      label: `${platform.charAt(0).toUpperCase()}${platform.slice(1)} ${width && height ? `${width}x${height}` : ''}`.trim(),
      width, height, theme,
    };
  }
  if (file.startsWith('og-')) {
    const platform = file.split('-')[1] ?? '';
    return {
      group: 'Social / Open Graph',
      label: `${platform.charAt(0).toUpperCase()}${platform.slice(1)} ${width && height ? `${width}x${height}` : ''}`.trim(),
      width, height, theme,
    };
  }
  if (file.startsWith('banner-')) {
    return {
      group: 'Banners',
      label: `${theme === 'dark' ? 'Dark' : 'Light'} ${width && height ? `${width}x${height}` : ''}`.trim(),
      width, height, theme,
    };
  }
  if (file.startsWith('android-icon-')) {
    return { group: 'Android Icons', label: `Android ${theme} ${width}px`, width, height, theme };
  }
  if (file.startsWith('apple-touch-icon')) {
    return {
      group: 'Apple Touch Icons',
      label: `Apple Touch ${theme} ${width ? `${width}px` : ''}`.trim(),
      width, height, theme,
    };
  }
  if (file === 'favicon.ico') {
    return { group: 'Favicons', label: 'Favicon (.ico)', theme: 'neutral' };
  }
  if (file.startsWith('favicon')) {
    return { group: 'Favicons', label: `Favicon ${width ? `${width}px` : file}`, width, height, theme };
  }
  if (file.startsWith('ms-tile-')) {
    return { group: 'MS Tile', label: `MS Tile ${theme} ${width}x${height}`, width, height, theme };
  }
  if (file.startsWith('maskable-icon-')) {
    return { group: 'Maskable (PWA)', label: `Maskable ${theme} ${width}px`, width, height, theme };
  }
  if (file.startsWith('app-store-icon-')) {
    return { group: 'App Store', label: `App Store ${theme} ${width}px`, width, height, theme };
  }
  if (file.startsWith('play-store-icon-')) {
    return { group: 'Play Store', label: `Play Store ${theme} ${width}px`, width, height, theme };
  }
  if (file === 'icon-rounded-dark.svg') {
    return { group: 'Brand Marks', label: 'Rounded dark (light UI)', theme: 'neutral' };
  }
  if (file === 'icon-rounded-white.svg') {
    return { group: 'Brand Marks', label: 'Rounded white (dark UI)', theme: 'dark' };
  }
  if (file === 'icon-only.svg') {
    return { group: 'Brand Marks', label: 'Icon only (transparent)', theme: 'neutral' };
  }
  return { group: 'Other', label: file, theme };
}

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export function marketingAssetsPlugin(): Plugin {
  return {
    name: 'sanidesk-marketing-assets',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root;
      const brandRoot = normalize(join(root, BRAND_DIR));

      server.middlewares.use('/sanidesk/ui/marketing-manifest', async (_req, res) => {
        try {
          const files = await fs.readdir(brandRoot);
          const entries: AssetEntry[] = [];
          for (const file of files) {
            if (file.startsWith('.') || file === 'generate.sh') continue;
            const ext = extname(file).toLowerCase();
            if (!MIME[ext]) continue;
            const stat = await fs.stat(join(brandRoot, file));
            if (!stat.isFile()) continue;
            entries.push({
              file,
              url: `/sanidesk/ui/marketing-files/${encodeURIComponent(file)}`,
              size: stat.size,
              ext: ext.slice(1),
              ...classify(file),
            });
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ count: entries.length, entries }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });

      server.middlewares.use('/sanidesk/ui/marketing-files/', async (req, res) => {
        const reqUrl = (req.url ?? '/').split('?')[0] ?? '/';
        const name = decodeURIComponent(reqUrl.replace(/^\/+/, ''));
        // Hard boundary — no slashes, no traversal, must resolve under brandRoot.
        if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
          res.statusCode = 400;
          res.end('Bad request');
          return;
        }
        const full = normalize(join(brandRoot, name));
        if (!full.startsWith(brandRoot)) {
          res.statusCode = 400;
          res.end('Bad request');
          return;
        }
        try {
          const stat = await fs.stat(full);
          if (!stat.isFile()) {
            res.statusCode = 404;
            res.end('Not found');
            return;
          }
          const ext = extname(full).toLowerCase();
          res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
          res.setHeader('Content-Length', String(stat.size));
          res.setHeader('Cache-Control', 'no-cache');
          createReadStream(full).pipe(res);
        } catch {
          res.statusCode = 404;
          res.end('Not found');
        }
      });
    },
  };
}
