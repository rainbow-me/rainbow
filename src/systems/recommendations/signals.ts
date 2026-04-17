import { ItemBookmarkedSignal, ItemCommittedSignal, ItemUnbookmarkedSignal, ItemViewedSignal, SignalKind } from './types';

// ============ Signal Factories =============================================== //

export const Signal = {
  bookmarked: <T>(item: T, options?: { occurredAtMs?: number }): ItemBookmarkedSignal<T> => ({
    item,
    kind: SignalKind.ITEM_BOOKMARKED,
    occurredAtMs: options?.occurredAtMs ?? Date.now(),
  }),

  committed: <T>(item: T, options?: { magnitude?: number; occurredAtMs?: number }): ItemCommittedSignal<T> => ({
    item,
    kind: SignalKind.ITEM_COMMITTED,
    magnitude: options?.magnitude,
    occurredAtMs: options?.occurredAtMs ?? Date.now(),
  }),

  unbookmarked: <T>(item: T, options?: { occurredAtMs?: number }): ItemUnbookmarkedSignal<T> => ({
    item,
    kind: SignalKind.ITEM_UNBOOKMARKED,
    occurredAtMs: options?.occurredAtMs ?? Date.now(),
  }),

  viewed: <T>(item: T, options?: { dwellMs?: number; occurredAtMs?: number }): ItemViewedSignal<T> => ({
    dwellMs: options?.dwellMs,
    item,
    kind: SignalKind.ITEM_VIEWED,
    occurredAtMs: options?.occurredAtMs ?? Date.now(),
  }),
};
