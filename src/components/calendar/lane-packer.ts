// ---------------------------------------------------------------------------
// Lane-packing + overflow clustering for SdCalendar grids.
//
// Standard calendar pattern: 1–N concurrent events split into N side-by-side
// sub-columns (lanes); when concurrency exceeds MAX_LANES, the surplus
// collapses into a single "cluster" block that the user can tap to expand.
//
// Tier A (split columns)  — sets size ≤ MAX_LANES → packed by sweep into
//                           lane indices.
// Tier B (cluster block)  — sets size > MAX_LANES → single block spanning
//                           the cluster's [min start, max end], carrying the
//                           full event list so the host page can pop a list.
//
// Two events "overlap" iff their [start, end] intervals share any moment.
// A "cluster" is the transitive closure of overlap — we walk sorted events
// and grow the current cluster as long as the next event starts before the
// cluster's running max-end.
// ---------------------------------------------------------------------------

import type { CalendarEvent } from './types';

export const MAX_LANES = 4;

export interface LaidOutEvent {
  kind: 'event';
  event: CalendarEvent;
  lane: number;       // 0-based
  laneCount: number;  // total lanes in this cluster
}

export interface LaidOutCluster {
  kind: 'cluster';
  events: CalendarEvent[];
  bucketStart: Date;
  bucketEnd: Date;
}

export type LaidOutItem = LaidOutEvent | LaidOutCluster;

/** Lay out a day's worth of events into lane-positioned items and overflow
 *  clusters. The input is not assumed sorted. */
export function packDayEvents(events: CalendarEvent[]): LaidOutItem[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => {
    const d = a.start.getTime() - b.start.getTime();
    return d !== 0 ? d : a.end.getTime() - b.end.getTime();
  });

  const out: LaidOutItem[] = [];
  let current: CalendarEvent[] = [];
  let currentMaxEnd = -Infinity;

  const flush = () => {
    if (current.length === 0) return;
    if (current.length <= MAX_LANES) {
      // Tier A — assign lanes with a sweep-line allocator.
      const laneEnds: number[] = [];  // when each lane next becomes free
      for (const ev of current) {
        let lane = laneEnds.findIndex((e) => e <= ev.start.getTime());
        if (lane < 0) {
          lane = laneEnds.length;
          laneEnds.push(0);
        }
        laneEnds[lane] = ev.end.getTime();
        out.push({ kind: 'event', event: ev, lane, laneCount: current.length });
      }
    } else {
      // Tier B — collapse to one cluster covering the full overlap span.
      const bucketStart = current.reduce(
        (min, e) => (e.start < min ? e.start : min),
        current[0]!.start,
      );
      const bucketEnd = current.reduce(
        (max, e) => (e.end > max ? e.end : max),
        current[0]!.end,
      );
      out.push({ kind: 'cluster', events: [...current], bucketStart, bucketEnd });
    }
    current = [];
    currentMaxEnd = -Infinity;
  };

  for (const ev of sorted) {
    const evStart = ev.start.getTime();
    if (current.length === 0 || evStart < currentMaxEnd) {
      current.push(ev);
      if (ev.end.getTime() > currentMaxEnd) currentMaxEnd = ev.end.getTime();
    } else {
      flush();
      current.push(ev);
      currentMaxEnd = ev.end.getTime();
    }
  }
  flush();
  return out;
}
