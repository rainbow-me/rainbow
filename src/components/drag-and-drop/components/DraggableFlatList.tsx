import React, {
  ComponentProps,
  ReactElement,
  // useCallback,
} from 'react';
import {
  CellRendererProps,
  // FlatListProps,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, {
  AnimatedProps,
  // runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  // useSharedValue,
} from 'react-native-reanimated';
import { useDndContext } from '../DndContext';
import { useDraggableSort, UseDraggableStackOptions } from '../features';
import type { UniqueIdentifier } from '../types';
import { swapByItemCenterPoint } from '../utils';
import { Draggable } from './Draggable';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnimatedFlatListProps<ItemT = any> = AnimatedProps<ComponentProps<typeof FlatList<ItemT>>>;

export type ViewableRange = {
  first: number | null;
  last: number | null;
};

export type DraggableFlatListProps<T extends { id: UniqueIdentifier }> = AnimatedFlatListProps<T> &
  Pick<UseDraggableStackOptions, 'onOrderChange' | 'onOrderUpdate' | 'shouldSwapWorklet'> & {
    debug?: boolean;
    gap?: number;
    horizontal?: boolean;
    initialOrder?: UniqueIdentifier[];
  };

export const DraggableFlatList = <T extends { id: UniqueIdentifier }>({
  data,
  // debug,
  gap = 0,
  horizontal = false,
  initialOrder,
  onOrderChange,
  onOrderUpdate,
  renderItem,
  shouldSwapWorklet = swapByItemCenterPoint,
  ...otherProps
}: DraggableFlatListProps<T>): ReactElement => {
  const { draggableActiveId, draggableContentOffset, draggableLayouts, draggableOffsets, draggableRestingOffsets } = useDndContext();
  const animatedFlatListRef = useAnimatedRef<FlatList<T>>();

  const {
    // draggablePlaceholderIndex,
    draggableSortOrder,
  } = useDraggableSort({
    horizontal,
    initialOrder,
    onOrderChange,
    onOrderUpdate,
    shouldSwapWorklet,
  });

  const direction = horizontal ? 'column' : 'row';
  const size = 1;

  // Track sort order changes and update the offsets
  useAnimatedReaction(
    () => draggableSortOrder.value,
    (nextOrder, prevOrder) => {
      // Ignore initial reaction
      if (prevOrder === null) {
        return;
      }
      const { value: activeId } = draggableActiveId;
      const { value: layouts } = draggableLayouts;
      const { value: offsets } = draggableOffsets;
      const { value: restingOffsets } = draggableRestingOffsets;
      if (!activeId) {
        return;
      }

      const activeLayout = layouts[activeId].value;
      const { width, height } = activeLayout;
      const restingOffset = restingOffsets[activeId];

      for (let nextIndex = 0; nextIndex < nextOrder.length; nextIndex++) {
        const itemId = nextOrder[nextIndex];
        const prevIndex = prevOrder.findIndex(id => id === itemId);
        // Skip items that haven't changed position
        if (nextIndex === prevIndex) {
          continue;
        }

        const prevRow = Math.floor(prevIndex / size);
        const prevCol = prevIndex % size;
        const nextRow = Math.floor(nextIndex / size);
        const nextCol = nextIndex % size;
        const moveCol = nextCol - prevCol;
        const moveRow = nextRow - prevRow;

        const offset = itemId === activeId ? restingOffset : offsets[itemId];

        if (!restingOffset || !offsets[itemId]) {
          continue;
        }

        switch (direction) {
          case 'row':
            offset.y.value += moveRow * (height + gap);
            break;
          case 'column':
            offset.x.value += moveCol * (width + gap);
            break;
          default:
            break;
        }
      }
    },
    []
  );

  const scrollHandler = useAnimatedScrollHandler(event => {
    draggableContentOffset.y.value = event.contentOffset.y;
  });

  /** ⚠️ TODO: Implement auto scrolling when dragging above or below the visible range */
  // const scrollToIndex = useCallback(
  //   (index: number) => {
  //     animatedFlatListRef.current?.scrollToIndex({
  //       index,
  //       viewPosition: 0,
  //       animated: true,
  //     });
  //   },
  //   [animatedFlatListRef]
  // );

  // const viewableRange = useSharedValue<ViewableRange>({
  //   first: null,
  //   last: null,
  // });

  // const onViewableItemsChanged = useCallback<NonNullable<FlatListProps<T>['onViewableItemsChanged']>>(
  //   ({ viewableItems }) => {
  //     viewableRange.value = {
  //       first: viewableItems[0].index,
  //       last: viewableItems[viewableItems.length - 1].index,
  //     };
  //     if (debug)
  //       console.log(`First viewable item index: ${viewableItems[0].index}, last: ${viewableItems[viewableItems.length - 1].index}`);
  //   },
  //   [debug, viewableRange]
  // );

  // useAnimatedReaction(
  //   () => draggablePlaceholderIndex.value,
  //   (next, prev) => {
  //     if (!Array.isArray(data)) {
  //       return;
  //     }
  //     if (debug) console.log(`placeholderIndex: ${prev} -> ${next}}, last visible= ${viewableRange.value.last}`);
  //     const {
  //       value: { first, last },
  //     } = viewableRange;
  //     if (last !== null && next >= last && last < data.length - 1) {
  //       if (next < data.length) {
  //         runOnJS(scrollToIndex)(next + 1);
  //       }
  //     } else if (first !== null && first > 0 && next <= first) {
  //       if (next > 0) {
  //         runOnJS(scrollToIndex)(next - 1);
  //       }
  //     }
  //   }
  // );
  /** END */

  /** 🛠️ DEBUGGING */
  // useAnimatedReaction(
  //   () => {
  //     const activeId = draggableActiveId.value;
  //     return activeId ? draggableStates.value[activeId].value : 'resting';
  //   },
  //   (next, prev) => {
  //     if (debug) console.log(`Active item state: ${prev} -> ${next}`);
  //     if (debug) console.log(`translationY.value=${draggableContentOffset.y.value}`);
  //   }
  // );

  // useAnimatedReaction(
  //   () => draggableActiveId.value,
  //   (next, prev) => {
  //     if (debug) console.log(`activeId: ${prev} -> ${next}`);
  //   }
  // );
  /** END */

  return (
    <Animated.FlatList
      CellRendererComponent={DraggableFlatListCellRenderer}
      data={data}
      onScroll={scrollHandler}
      // onViewableItemsChanged={onViewableItemsChanged}
      ref={animatedFlatListRef}
      removeClippedSubviews={false}
      renderItem={renderItem}
      renderScrollComponent={props => {
        return (
          <Animated.ScrollView
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
          />
        );
      }}
      viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      // eslint-disable-next-line react/jsx-props-no-spreading, @typescript-eslint/no-explicit-any
      {...(otherProps as any)}
    />
  );
};

export const DraggableFlatListCellRenderer = function DraggableFlatListCellRenderer<ItemT extends { id: UniqueIdentifier }>(
  props: CellRendererProps<ItemT>
) {
  const { item, children } = props;
  return (
    <Draggable activationDelay={200} activeScale={1.025} dragDirection="y" id={item.id.toString()}>
      {children}
    </Draggable>
  );
};
