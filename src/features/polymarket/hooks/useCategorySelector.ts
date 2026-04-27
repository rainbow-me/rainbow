import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { type LayoutChangeEvent, type ScrollView } from 'react-native';

import { useListen, type BaseStore } from '@storesjs/stores';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

type ItemLayout = { x: number; width: number };

type UseCategorySelectorParams<StoreState, Item, Key extends string> = {
  containerWidth: number;
  getItemKey: (item: Item) => Key;
  horizontalPadding: number;
  isNonDefaultInitialSelection?: (initialKey: Key) => boolean;
  items: readonly Item[];
  scrollViewRef: RefObject<ScrollView | null>;
  selectStoreKey: (state: StoreState) => Key;
  setStoreKey: (key: Key) => void;
  store: BaseStore<StoreState>;
};

type UseCategorySelectorResult<Item, Key extends string> = {
  onItemLayout: (event: LayoutChangeEvent, index: number) => void;
  onPress: (item: Item) => void;
  selectedKey: SharedValue<Key>;
  skipInitialAnimation: SharedValue<boolean>;
};

export function useCategorySelector<StoreState, Item, Key extends string>({
  containerWidth,
  getItemKey,
  horizontalPadding,
  isNonDefaultInitialSelection,
  items,
  scrollViewRef,
  selectStoreKey,
  setStoreKey,
  store,
}: UseCategorySelectorParams<StoreState, Item, Key>): UseCategorySelectorResult<Item, Key> {
  const itemLayouts = useRef<ItemLayout[]>([]);
  const didInitialScroll = useRef(false);
  const initialKey = selectStoreKey(store.getState());
  const selectedKey = useSharedValue<Key>(initialKey);
  const skipInitialAnimation = useSharedValue(isNonDefaultInitialSelection?.(initialKey) ?? false);

  useEffect(() => {
    // Clear after first paint so taps + external syncs animate normally.
    skipInitialAnimation.value = false;
  }, [skipInitialAnimation]);

  const scrollToKey = useCallback(
    (key: Key, animated = false) => {
      const index = items.findIndex(item => getItemKey(item) === key);
      const scrollX = calculateCenteredScrollX(itemLayouts.current, index, containerWidth, horizontalPadding);
      scrollViewRef.current?.scrollTo({ x: scrollX, y: 0, animated });
    },
    [containerWidth, getItemKey, horizontalPadding, items, scrollViewRef]
  );

  const scrollToSelectedKey = useCallback(() => {
    scrollToKey(selectedKey.value);
  }, [scrollToKey, selectedKey]);

  const syncExternalSelection = useCallback(
    (nextKey: Key) => {
      if (selectedKey.value === nextKey) return;

      selectedKey.value = nextKey;
      if (allItemsMeasured(itemLayouts.current, items.length)) scrollToKey(nextKey, true);
    },
    [items.length, scrollToKey, selectedKey]
  );

  useListen(store, selectStoreKey, syncExternalSelection);

  const onItemLayout = useCallback(
    (event: LayoutChangeEvent, index: number) => {
      itemLayouts.current[index] = { x: event.nativeEvent.layout.x, width: event.nativeEvent.layout.width };
      if (!didInitialScroll.current && allItemsMeasured(itemLayouts.current, items.length)) {
        didInitialScroll.current = true;
        scrollToSelectedKey();
      }
    },
    [items.length, scrollToSelectedKey]
  );

  const onPress = useCallback(
    (item: Item) => {
      const key = getItemKey(item);
      selectedKey.value = key;
      if (allItemsMeasured(itemLayouts.current, items.length)) scrollToKey(key, true);
      setStoreKey(key);
    },
    [getItemKey, items.length, scrollToKey, selectedKey, setStoreKey]
  );

  return { onItemLayout, onPress, selectedKey, skipInitialAnimation };
}

function allItemsMeasured(layouts: ItemLayout[], itemCount: number): boolean {
  return layouts.filter(Boolean).length === itemCount;
}

function calculateCenteredScrollX(layouts: ItemLayout[], index: number, containerWidth: number, horizontalPadding: number): number {
  const layout = layouts[index];
  const lastLayout = layouts[layouts.length - 1];
  if (!layout || !lastLayout) return 0;

  const itemCenter = layout.x + layout.width / 2;
  const contentWidth = lastLayout.x + lastLayout.width + horizontalPadding;
  const maxScroll = Math.max(0, contentWidth - containerWidth);

  return Math.min(Math.max(0, itemCenter - containerWidth / 2), maxScroll);
}
