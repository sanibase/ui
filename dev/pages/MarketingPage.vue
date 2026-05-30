<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PhDownloadSimple, PhCopy, PhCheck, PhMagnifyingGlass } from '@phosphor-icons/vue';

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

const entries = ref<AssetEntry[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const search = ref('');
const activeGroup = ref<string>('All');
const copiedFile = ref<string | null>(null);

onMounted(async () => {
  try {
    const resp = await fetch('/sanidesk/ui/marketing-manifest');
    if (!resp.ok) throw new Error(`Manifest fetch failed (${resp.status})`);
    const data = await resp.json();
    entries.value = data.entries ?? [];
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
});

const groups = computed(() => {
  const set = new Set<string>();
  for (const e of entries.value) set.add(e.group);
  // Stable order: brand marks first, then icons by size, banners, social, other last.
  const order = [
    'Brand Marks',
    'Banners (Selling Point)', 'Social / OG (Selling Point)',
    'Banners', 'Social / Open Graph',
    'Favicons', 'Android Icons', 'Apple Touch Icons',
    'Maskable (PWA)', 'MS Tile', 'App Store', 'Play Store',
    'Other',
  ];
  return ['All', ...Array.from(set).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  })];
});

const groupCounts = computed(() => {
  const counts: Record<string, number> = { All: entries.value.length };
  for (const e of entries.value) counts[e.group] = (counts[e.group] ?? 0) + 1;
  return counts;
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return entries.value.filter((e) => {
    if (activeGroup.value !== 'All' && e.group !== activeGroup.value) return false;
    if (!q) return true;
    return e.file.toLowerCase().includes(q) || e.label.toLowerCase().includes(q);
  });
});

const byGroup = computed(() => {
  const map: Record<string, AssetEntry[]> = {};
  for (const e of filtered.value) {
    if (!map[e.group]) map[e.group] = [];
    map[e.group]!.push(e);
  }
  for (const list of Object.values(map)) {
    list.sort((a, b) => {
      if (a.theme !== b.theme) {
        const order = { light: 0, neutral: 1, dark: 2 };
        return (order[a.theme ?? 'neutral']) - (order[b.theme ?? 'neutral']);
      }
      return (a.width ?? 0) - (b.width ?? 0) || a.file.localeCompare(b.file);
    });
  }
  return map;
});

const orderedGroups = computed(() => {
  // Same display order as the chips.
  const order = [
    'Brand Marks',
    'Banners (Selling Point)', 'Social / OG (Selling Point)',
    'Banners', 'Social / Open Graph',
    'Favicons', 'Android Icons', 'Apple Touch Icons',
    'Maskable (PWA)', 'MS Tile', 'App Store', 'Play Store',
    'Other',
  ];
  return Object.keys(byGroup.value).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
});

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function copyUrl(entry: AssetEntry) {
  const absolute = new URL(entry.url, window.location.origin).toString();
  try {
    await navigator.clipboard.writeText(absolute);
    copiedFile.value = entry.file;
    setTimeout(() => { if (copiedFile.value === entry.file) copiedFile.value = null; }, 1500);
  } catch {
    // No clipboard permission — fall back to the input-select pattern.
    const ta = document.createElement('textarea');
    ta.value = absolute;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copiedFile.value = entry.file;
    setTimeout(() => { if (copiedFile.value === entry.file) copiedFile.value = null; }, 1500);
  }
}

</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="font-heading text-2xl font-bold text-sd-text mb-1">Marketing Assets</h1>
      <p class="text-sd-text-secondary text-sm">
        Brand marks, app icons, banners and social cards. Always reflects what's
        in <code class="text-xs bg-sd-bg-alt px-1 py-0.5 rounded">apps/web/public/media/brand-assets/</code>.
        Drop a new file in there, refresh, it shows up. Dev-only page.
      </p>
    </div>

    <!-- Search + filter chips -->
    <div class="sticky top-14 z-40 -mx-6 px-6 py-3 bg-sd-bg-alt/95 backdrop-blur border-b border-sd-border mb-6">
      <div class="relative max-w-md mb-3">
        <PhMagnifyingGlass :size="16" weight="regular" class="absolute left-3 top-1/2 -translate-y-1/2 text-sd-text-muted" />
        <input
          v-model="search"
          type="search"
          placeholder="Search by name (e.g. og-facebook, banner, 512)"
          class="w-full pl-9 pr-3 py-2 text-sm bg-white border border-sd-border rounded-sd focus:outline-none focus:border-sd-purple focus:ring-2 focus:ring-sd-purple/20"
        />
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="g in groups"
          :key="g"
          type="button"
          class="px-3 py-1 text-xs font-medium rounded-full border transition-colors"
          :class="activeGroup === g
            ? 'bg-sd-purple text-white border-sd-purple'
            : 'bg-white text-sd-text border-sd-border hover:border-sd-purple/40'"
          @click="activeGroup = g"
        >
          {{ g }}
          <span
            class="ml-1 text-[10px]"
            :class="activeGroup === g ? 'opacity-80' : 'text-sd-text-muted'"
          >{{ groupCounts[g] ?? 0 }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-sd-text-muted text-sm py-12 text-center">
      Loading manifest...
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-sd-md p-4 text-sm">
      Could not load asset manifest: {{ error }}
    </div>

    <div v-else-if="filtered.length === 0" class="text-sd-text-muted text-sm py-12 text-center">
      No assets match.
    </div>

    <div v-else class="space-y-10">
      <section v-for="group in orderedGroups" :key="group">
        <h2 class="font-heading text-base font-semibold text-sd-text mb-3 flex items-baseline gap-2">
          {{ group }}
          <span class="text-xs font-normal text-sd-text-muted">{{ byGroup[group]!.length }}</span>
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="entry in byGroup[group]"
            :key="entry.file"
            class="bg-white rounded-sd-md border border-sd-border p-3 flex items-center gap-3"
          >
            <div
              class="flex-shrink-0 w-16 h-16 rounded-sd flex items-center justify-center overflow-hidden"
              :class="entry.theme === 'dark' ? 'bg-[#1a1a2e]' : entry.ext === 'svg' ? 'bg-checker' : 'bg-sd-bg-alt'"
            >
              <img :src="entry.url" :alt="entry.label" class="max-w-full max-h-full object-contain" loading="lazy" />
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-sd-text truncate" :title="entry.label">
                {{ entry.label }}
              </p>
              <p class="text-[11px] text-sd-text-muted font-mono truncate" :title="entry.file">
                {{ entry.file }}
              </p>
              <p class="text-[11px] text-sd-text-muted">
                {{ entry.ext.toUpperCase() }}<template v-if="entry.width && entry.height"> · {{ entry.width }}x{{ entry.height }}</template> · {{ fmtSize(entry.size) }}
              </p>
            </div>

            <div class="flex-shrink-0 flex flex-col gap-1.5">
              <a
                :href="entry.url"
                :download="entry.file"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sd-purple hover:bg-sd-purple-dark text-white text-xs font-medium rounded-sd no-underline transition-colors"
                :title="`Download ${entry.file}`"
              >
                <PhDownloadSimple :size="14" weight="bold" />
                Download
              </a>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-1 px-2.5 py-1 border border-sd-border text-sd-text text-[11px] font-medium rounded-sd hover:bg-sd-bg-alt transition-colors"
                @click="copyUrl(entry)"
              >
                <component :is="copiedFile === entry.file ? PhCheck : PhCopy" :size="12" weight="bold" />
                {{ copiedFile === entry.file ? 'Copied' : 'Copy URL' }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.bg-checker {
  background-image:
    linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
    linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
    linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
  background-color: white;
}
</style>
