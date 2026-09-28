import { useEffect, useLayoutEffect } from 'react';

import { debounce } from 'lodash';

import { time } from '@/framework/core/utils/time';
import { useStableValue } from '@/hooks/useStableValue';

// ============ Types ========================================================== //

export type ViewabilitySelectors<Item> = {
  getId: (item: Item) => string | undefined;
  getChildKey?: (item: Item) => string | undefined;
};

type ViewabilityHandlers<Item> = {
  onViewableItemsChanged: (info: { viewableItems: readonly Item[] }) => void;
  onChildViewableItemsChanged: (parentKey: string, items: readonly { item: string }[]) => void;
};

type OnChange = (ids: readonly string[]) => void;

type ViewabilityTracker<Item> = {
  handlers: ViewabilityHandlers<Item>;
  update: (selectors: ViewabilitySelectors<Item>, onChange: OnChange) => void;
  start: () => () => void;
};

/**
 * A matching prefix length, a single ID, or a Set for the remaining cases.
 */
type CollectedIds = number | string | Set<string>;

// ============ Constants ====================================================== //

const DEFAULT_MAX_WAIT = Object.freeze({ maxWait: time.ms(500) });
const EMPTY_IDS: readonly string[] = Object.freeze([]);

// ============ Hook =========================================================== //

/**
 * Combines complete viewport reports, including child lists whose parent is visible.
 * Projects unique IDs after scrolling settles, at least once per second during continuous
 * changes. An empty outer report clears immediately. Unmount cancels pending publication.
 *
 * Keep selectors stable. Lists must report changes to visible identities, including empty viewports.
 */
export function useViewabilityTracker<Item>(selectors: ViewabilitySelectors<Item>, onChange: OnChange): ViewabilityHandlers<Item> {
  const tracker = useStableValue(() => createViewabilityTracker(selectors));

  useLayoutEffect(() => tracker.start(), [tracker]);

  useEffect(() => {
    tracker.update(selectors, onChange);
  }, [onChange, selectors, tracker]);

  return tracker.handlers;
}

// ============ Tracker ======================================================== //

function createViewabilityTracker<Item>(initialSelectors: ViewabilitySelectors<Item>): ViewabilityTracker<Item> {
  let selectors = initialSelectors;
  let onChange: OnChange | undefined;

  let visibleItems: readonly Item[] = [];
  let childReports: Map<string, readonly { item: string }[]> | undefined;
  let publishedIds = EMPTY_IDS;
  let isTracking = true;

  const schedule = debounce(publish, time.ms(250), DEFAULT_MAX_WAIT);

  function publish(notifyUnchanged = false): void {
    schedule.cancel();
    if (!onChange) return;

    let collected: CollectedIds = 0;
    for (const item of visibleItems) {
      const id = selectors.getId(item);
      if (id !== undefined) collected = collectId(collected, id, publishedIds);

      const childKey = selectors.getChildKey?.(item);
      const childItems = childKey === undefined ? undefined : childReports?.get(childKey);
      if (childItems) {
        for (const child of childItems) collected = collectId(collected, child.item, publishedIds);
      }
    }

    const ids = resolveIds(collected, publishedIds);
    if (!notifyUnchanged && ids === publishedIds) return;
    publishedIds = ids;
    onChange(publishedIds);
  }

  return {
    handlers: {
      onViewableItemsChanged: ({ viewableItems }) => {
        if (!isTracking) return;
        visibleItems = viewableItems;
        if (!onChange) return;

        if (viewableItems.length) schedule();
        else publish();
      },

      onChildViewableItemsChanged: (parentKey, items) => {
        if (!isTracking) return;
        if (items.length) (childReports ??= new Map()).set(parentKey, items);
        else childReports?.delete(parentKey);
        if (!onChange) return;

        for (let i = 0; i < visibleItems.length; i++) {
          if (selectors.getChildKey?.(visibleItems[i]) === parentKey) {
            schedule();
            return;
          }
        }
      },
    },

    update(nextSelectors, nextOnChange): void {
      const isOnChangeEqual = onChange === nextOnChange;
      selectors = nextSelectors;
      onChange = nextOnChange;
      publish(!isOnChangeEqual);
    },

    start(): () => void {
      isTracking = true;
      return () => {
        isTracking = false;
        onChange = undefined;
        schedule.cancel();
      };
    },
  };
}

// ============ Helpers ======================================================== //

function collectId(collected: CollectedIds, id: string, previous: readonly string[]): CollectedIds {
  let ids: Set<string>;

  if (typeof collected === 'number') {
    if (previous[collected] === id) return collected + 1;
    if (collected === 0) return id;
    if (previous[collected - 1] === id) return collected;

    ids = new Set<string>();
    for (let i = 0; i < collected; i++) ids.add(previous[i]);
  } else if (typeof collected === 'string') {
    if (collected === id) return collected;

    ids = new Set<string>();
    ids.add(collected);
  } else {
    ids = collected;
  }

  ids.add(id);
  return ids;
}

function resolveIds(collected: CollectedIds, previous: readonly string[]): readonly string[] {
  if (typeof collected === 'string') return [collected];
  if (typeof collected !== 'number') return hasSameIds(previous, collected) ? previous : [...collected];
  if (collected === previous.length) return previous;
  return collected ? previous.slice(0, collected) : EMPTY_IDS;
}

function hasSameIds(previous: readonly string[], next: ReadonlySet<string>): boolean {
  if (previous.length !== next.size) return false;
  for (const id of previous) if (!next.has(id)) return false;
  return true;
}
