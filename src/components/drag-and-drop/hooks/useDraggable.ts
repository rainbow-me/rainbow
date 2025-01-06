import { useCallback, useLayoutEffect } from 'react';
import { LayoutRectangle, ViewProps } from 'react-native';
import { runOnUI, useSharedValue } from 'react-native-reanimated';
import { IS_IOS } from '@/env';
import { useLayoutWorklet } from '@/hooks/reanimated/useLayoutWorklet';
import { DraggableState, useDndContext } from '../DndContext';
import { useLatestSharedValue, useNodeRef } from '../hooks';
import { Data, NativeElement, UniqueIdentifier } from '../types';
import { assert, isReanimatedSharedValue } from '../utils';
import { useSharedPoint } from './useSharedPoint';

export type DraggableConstraints = {
  activationDelay: number;
  activationTolerance: number;
};

export type UseDraggableOptions = Partial<DraggableConstraints> & {
  id: UniqueIdentifier;
  data?: Data;
  disabled?: boolean;
};

/**
 * useDraggable is a custom hook that provides functionality for making a component draggable within a drag and drop context.
 *
 * @function
 * @example
 * const { offset, setNodeRef, activeId, setNodeLayout, draggableState } = useDraggable({ id: 'draggable-1' });
 *
 * @param {object} options - The options that define the behavior of the draggable component.
 * @param {string} options.id - A unique identifier for the draggable component.
 * @param {object} [options.data={}] - Optional data associated with the draggable component.
 * @param {boolean} [options.disabled=false] - A flag that indicates whether the draggable component is disabled.
 * @param {number} [options.activationDelay=0] - A number representing the duration, in milliseconds, that this draggable item needs to be held for before allowing a drag to start.
 * @param {number} [options.activationTolerance=Infinity] - A number representing the distance, in points, of motion that is tolerated before the drag operation is aborted.
 *
 * @returns {object} Returns an object with properties and methods related to the draggable component.
 * @property {object} offset - An object representing the current offset of the draggable component.
 * @property {Function} setNodeRef - A function that can be used to set the ref of the draggable component.
 * @property {string} activeId - The unique identifier of the currently active draggable component.
 * @property {string} actingId - The unique identifier of the currently interacti draggable component.
 * @property {Function} setNodeLayout - A function that handles the layout event of the draggable component.
 * @property {object} draggableState - An object representing the current state of the draggable component.
 */
export const useDraggable = ({
  id,
  data = {},
  disabled = false,
  activationDelay = 0,
  activationTolerance = Infinity,
}: UseDraggableOptions) => {
  const {
    containerRef,
    draggableLayouts,
    draggableOffsets,
    draggableRestingOffsets,
    draggableOptions,
    draggableStates,
    draggableActiveId,
    panGestureState,
  } = useDndContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [node, setNodeRef] = useNodeRef<NativeElement, any>();
  // const key = useUniqueId("Draggable");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sharedData = isReanimatedSharedValue(data) ? data : useLatestSharedValue(data);

  const layout = useSharedValue<LayoutRectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const offset = useSharedPoint(0, 0);
  const restingOffset = useSharedPoint(0, 0);
  const state = useSharedValue<DraggableState>('resting');

  // Register early to allow proper referencing in useDraggableStyle
  draggableStates.value[id] = state;

  useLayoutEffect(() => {
    const runLayoutEffect = () => {
      'worklet';
      draggableLayouts.modify(prev => {
        const newValue = { ...prev, [id]: layout };
        return newValue;
      });
      draggableOffsets.modify(prev => {
        const newValue = { ...prev, [id]: offset };
        return newValue;
      });
      draggableRestingOffsets.modify(prev => {
        const newValue = { ...prev, [id]: restingOffset };
        return newValue;
      });
      draggableOptions.modify(prev => {
        const newValue = { ...prev, [id]: { id, data: sharedData, disabled, activationDelay, activationTolerance } };
        return newValue;
      });
      draggableStates.modify(prev => {
        const newValue = { ...prev, [id]: state };
        return newValue;
      });
    };
    runOnUI(runLayoutEffect)();

    return () => {
      const cleanupLayoutEffect = () => {
        'worklet';
        draggableLayouts.modify(value => {
          delete value[id];
          return value;
        });
        draggableOffsets.modify(value => {
          delete value[id];
          return value;
        });
        draggableRestingOffsets.modify(value => {
          delete value[id];
          return value;
        });
        draggableOptions.modify(value => {
          delete value[id];
          return value;
        });
        draggableStates.modify(value => {
          delete value[id];
          return value;
        });
      };
      runOnUI(cleanupLayoutEffect)();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Standard onLayout event for Android — also required to trigger 'topLayout' event on iOS
  const onLayout: ViewProps['onLayout'] = useCallback(() => {
    if (IS_IOS) return;

    assert(containerRef.current);
    node.current?.measureLayout(containerRef.current, (x, y, width, height) => {
      layout.modify(value => {
        'worklet';
        value.x = x;
        value.y = y;
        value.width = width;
        value.height = height;
        return value;
      });
    });
  }, [containerRef, node, layout]);

  // Worklet-based onLayout event for iOS
  const onLayoutWorklet = useLayoutWorklet(layoutInfo => {
    'worklet';

    layout.modify(value => {
      value.x = layoutInfo.x;
      value.y = layoutInfo.y;
      value.width = layoutInfo.width;
      value.height = layoutInfo.height;
      return value;
    });
  });

  return {
    offset,
    state,
    setNodeRef,
    activeId: draggableActiveId,
    onLayout,
    onLayoutWorklet,
    panGestureState,
  };
};
