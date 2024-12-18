import React, {
  ComponentType,
  forwardRef,
  MutableRefObject,
  PropsWithChildren,
  RefObject,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { LayoutRectangle, StyleProp, View, ViewStyle } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureEventPayload,
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGesture,
  PanGestureHandlerEventPayload,
  State,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { cancelAnimation, runOnJS, useAnimatedReaction, useSharedValue, type WithSpringConfig } from 'react-native-reanimated';
import { useAnimatedTimeout } from '@/hooks/reanimated/useAnimatedTimeout';
import {
  DndContext,
  DraggableStates,
  type DndContextValue,
  type DraggableOptions,
  type DroppableOptions,
  type ItemOptions,
  type Layouts,
  type Offsets,
} from './DndContext';
import { useSharedPoint } from './hooks';
import type { UniqueIdentifier } from './types';
import { animatePointWithSpring, applyOffset, getDistance, includesPoint, overlapsRectangle, Point, Rectangle } from './utils';

export type DndProviderProps = {
  activationDelay?: number;
  debug?: boolean;
  disabled?: boolean;
  gestureRef?: MutableRefObject<PanGesture>;
  hapticFeedback?: HapticFeedbackTypes;
  minDistance?: number;
  onBegin?: (
    event: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
    meta: { activeId: UniqueIdentifier; activeLayout: LayoutRectangle }
  ) => void;
  onDragEnd?: (event: { active: ItemOptions; over: ItemOptions | null }) => void;
  onFinalize?: (
    event: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
    meta: { activeId: UniqueIdentifier; activeLayout: LayoutRectangle }
  ) => void;
  onUpdate?: (
    event: GestureUpdateEvent<PanGestureHandlerEventPayload>,
    meta: { activeId: UniqueIdentifier; activeLayout: LayoutRectangle }
  ) => void;
  onActivationWorklet?: (next: UniqueIdentifier | null, prev: UniqueIdentifier | null) => void;
  simultaneousHandlers?: RefObject<ComponentType<object>>;
  springConfig?: WithSpringConfig;
  style?: StyleProp<ViewStyle>;
  waitFor?: RefObject<ComponentType<object>>;
};

export type DndProviderHandle = Pick<
  DndContextValue,
  'draggableLayouts' | 'draggableOffsets' | 'draggableRestingOffsets' | 'draggableActiveId'
>;

export const DndProvider = forwardRef<DndProviderHandle, PropsWithChildren<DndProviderProps>>(function DndProvider(
  {
    activationDelay = 0,
    children,
    debug,
    disabled,
    gestureRef,
    hapticFeedback,
    minDistance = 0,
    onBegin,
    onDragEnd,
    onFinalize,
    onUpdate,
    onActivationWorklet,
    simultaneousHandlers,
    springConfig = {},
    style,
    waitFor,
  },
  ref
) {
  const containerRef = useRef<View | null>(null);
  const draggableLayouts = useSharedValue<Layouts>({});
  const droppableLayouts = useSharedValue<Layouts>({});
  const draggableOptions = useSharedValue<DraggableOptions>({});
  const droppableOptions = useSharedValue<DroppableOptions>({});
  const draggableOffsets = useSharedValue<Offsets>({});
  const draggableRestingOffsets = useSharedValue<Offsets>({});
  const draggableStates = useSharedValue<DraggableStates>({});
  const draggablePendingId = useSharedValue<UniqueIdentifier | null>(null);
  const draggableActiveId = useSharedValue<UniqueIdentifier | null>(null);
  const droppableActiveId = useSharedValue<UniqueIdentifier | null>(null);
  const draggableActiveLayout = useSharedValue<Rectangle | null>(null);
  const draggableInitialOffset = useSharedPoint(0, 0);
  const draggableContentOffset = useSharedPoint(0, 0);
  const panGestureState = useSharedValue<GestureEventPayload['state']>(0);

  const runFeedback = () => {
    if (hapticFeedback) {
      ReactNativeHapticFeedback.trigger(hapticFeedback);
    }
  };

  useAnimatedReaction(
    () => (hapticFeedback ? draggableActiveId.value : null),
    current => {
      if (current !== null) {
        runOnJS(runFeedback)();
      }
    },
    []
  );

  const contextValue = useRef<DndContextValue>({
    containerRef,
    draggableLayouts,
    droppableLayouts,
    draggableOptions,
    droppableOptions,
    draggableOffsets,
    draggableRestingOffsets,
    draggableStates,
    draggablePendingId,
    draggableActiveId,
    droppableActiveId,
    panGestureState,
    draggableInitialOffset,
    draggableActiveLayout,
    draggableContentOffset,
  });

  useImperativeHandle(
    ref,
    () => {
      return {
        draggableLayouts,
        draggableOffsets,
        draggableRestingOffsets,
        draggableActiveId,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Handle activation changes
  useAnimatedReaction(
    () => draggableActiveId.value,
    (next, prev) => {
      if (next !== null) {
        onActivationWorklet?.(next, prev);
      }
    },
    []
  );

  const setActiveId = useCallback(() => {
    'worklet';
    const id = draggablePendingId.value;

    if (id !== null) {
      debug && console.log(`draggableActiveId.value = ${id}`);
      draggableActiveId.value = id;

      const { value: layouts } = draggableLayouts;
      const { value: offsets } = draggableOffsets;
      const { value: activeLayout } = layouts[id];
      const activeOffset = offsets[id];

      draggableActiveLayout.value = applyOffset(activeLayout, {
        x: activeOffset.x.value,
        y: activeOffset.y.value,
      });
      draggableStates.value[id].value = 'dragging';
    }
  }, [debug, draggableActiveId, draggableActiveLayout, draggableLayouts, draggableOffsets, draggablePendingId, draggableStates]);

  const { clearTimeout: clearActiveIdTimeout, start: setActiveIdWithDelay } = useAnimatedTimeout({
    delayMs: activationDelay,
    onTimeoutWorklet: setActiveId,
  });

  const panGesture = useMemo(() => {
    const findActiveLayoutId = (point: Point): UniqueIdentifier | null => {
      'worklet';
      const { x, y } = point;
      const { value: layouts } = draggableLayouts;
      const { value: offsets } = draggableOffsets;
      const { value: options } = draggableOptions;
      for (const [id, layout] of Object.entries(layouts)) {
        // console.log({ [id]: floorLayout(layout.value) });
        const offset = offsets[id];
        const isDisabled = options[id].disabled;
        if (
          !isDisabled &&
          includesPoint(layout.value, {
            x: x - offset.x.value + draggableContentOffset.x.value,
            y: y - offset.y.value + draggableContentOffset.y.value,
          })
        ) {
          return id;
        }
      }
      return null;
    };

    const findDroppableLayoutId = (activeLayout: LayoutRectangle): UniqueIdentifier | null => {
      'worklet';
      const { value: layouts } = droppableLayouts;
      const { value: options } = droppableOptions;
      for (const [id, layout] of Object.entries(layouts)) {
        // console.log({ [id]: floorLayout(layout.value) });
        const isDisabled = options[id].disabled;
        if (!isDisabled && overlapsRectangle(activeLayout, layout.value)) {
          return id;
        }
      }
      return null;
    };

    const panGesture = Gesture.Pan()
      .maxPointers(1)
      .enabled(!disabled)
      .onBegin(event => {
        const { state, x, y } = event;
        debug && console.log('begin', { state, x, y });
        // console.log("begin", { state, x, y });
        // Track current state for cancellation purposes
        panGestureState.value = state;
        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;
        const { value: restingOffsets } = draggableRestingOffsets;
        const { value: options } = draggableOptions;
        const { value: states } = draggableStates;
        // for (const [id, offset] of Object.entries(offsets)) {
        //   console.log({ [id]: [offset.x.value, offset.y.value] });
        // }
        // Find the active layout key under {x, y}
        const activeId = findActiveLayoutId({ x, y });
        // Check if an item was actually selected
        if (activeId !== null) {
          // Record any ongoing current offset as our initial offset for the gesture
          const activeLayout = layouts[activeId].value;
          const activeOffset = offsets[activeId];
          const restingOffset = restingOffsets[activeId];
          const { value: activeState } = states[activeId];
          draggableInitialOffset.x.value = activeOffset.x.value;
          draggableInitialOffset.y.value = activeOffset.y.value;
          // Cancel the ongoing animation if we just reactivated an acting/dragging item
          if (['dragging', 'acting'].includes(activeState)) {
            cancelAnimation(activeOffset.x);
            cancelAnimation(activeOffset.y);
            // If not we should reset the resting offset to the current offset value
            // But only if the item is not currently still animating
          } else {
            // active or pending
            // Record current offset as our natural resting offset for the gesture
            restingOffset.x.value = activeOffset.x.value;
            restingOffset.y.value = activeOffset.y.value;
          }
          // Update activeId directly or with an optional delay
          const { activationDelay } = options[activeId];

          if (activationDelay > 0) {
            draggablePendingId.value = activeId;
            draggableStates.value[activeId].value = 'pending';
            setActiveIdWithDelay();
          } else {
            draggableActiveId.value = activeId;
            draggableActiveLayout.value = applyOffset(activeLayout, {
              x: activeOffset.x.value,
              y: activeOffset.y.value,
            });
            draggableStates.value[activeId].value = 'dragging';
          }

          if (onBegin) {
            onBegin(event, { activeId, activeLayout });
          }
        }
      })
      .onChange(event => {
        // console.log(draggableStates.value);
        const { state, translationX, translationY, changeX, changeY } = event;
        debug && console.log('update', { state, changeX, changeY });
        // Track current state for cancellation purposes
        panGestureState.value = state;
        const { value: activeId } = draggableActiveId;
        const { value: pendingId } = draggablePendingId;
        const { value: options } = draggableOptions;
        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;
        if (activeId === null) {
          // Check if we are currently waiting for activation delay
          if (pendingId !== null) {
            const { activationTolerance } = options[pendingId];
            // Check if we've moved beyond the activation tolerance
            const distance = getDistance(translationX, translationY);
            if (distance > activationTolerance) {
              draggablePendingId.value = null;
              clearActiveIdTimeout();
            }
          }
          // Ignore item-free interactions
          return;
        }
        // Update our active offset to pan the active item
        const activeOffset = offsets[activeId];

        activeOffset.x.value += changeX;
        activeOffset.y.value += changeY;

        // Check potential droppable candidates
        const activeLayout = layouts[activeId].value;
        draggableActiveLayout.value = applyOffset(activeLayout, {
          x: activeOffset.x.value,
          y: activeOffset.y.value,
        });
        droppableActiveId.value = findDroppableLayoutId(draggableActiveLayout.value);
        if (onUpdate) {
          onUpdate(event, { activeId, activeLayout: draggableActiveLayout.value });
        }
      })
      .onFinalize(event => {
        const { state, velocityX, velocityY } = event;
        debug && console.log('finalize', { state, velocityX, velocityY });
        // Track current state for cancellation purposes
        panGestureState.value = state; // can be `FAILED` or `ENDED`
        const { value: activeId } = draggableActiveId;
        const { value: pendingId } = draggablePendingId;
        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;
        const { value: restingOffsets } = draggableRestingOffsets;
        const { value: states } = draggableStates;
        // Ignore item-free interactions
        if (activeId === null) {
          // Check if we were currently waiting for activation delay
          if (pendingId !== null) {
            draggablePendingId.value = null;
            clearActiveIdTimeout();
          }
          return;
        }
        // Reset interaction-related shared state for styling purposes
        draggableActiveId.value = null;
        if (onFinalize) {
          const activeLayout = layouts[activeId].value;
          const activeOffset = offsets[activeId];
          const updatedLayout = applyOffset(activeLayout, {
            x: activeOffset.x.value,
            y: activeOffset.y.value,
          });
          onFinalize(event, { activeId, activeLayout: updatedLayout });
        }
        // Callback
        if (state !== State.FAILED && onDragEnd) {
          const { value: dropActiveId } = droppableActiveId;
          onDragEnd({
            active: draggableOptions.value[activeId],
            over: dropActiveId !== null ? droppableOptions.value[dropActiveId] : null,
          });
        }
        // Reset droppable
        droppableActiveId.value = null;
        // Move back to initial position
        const activeOffset = offsets[activeId];
        const restingOffset = restingOffsets[activeId];
        states[activeId].value = 'acting';
        const [targetX, targetY] = [restingOffset.x.value, restingOffset.y.value];
        animatePointWithSpring(
          activeOffset,
          [targetX, targetY],
          [
            { ...springConfig, velocity: velocityX / 4 },
            { ...springConfig, velocity: velocityY / 4 },
          ],
          () => {
            // Cancel if we are interacting again with this item
            if (panGestureState.value !== State.END && panGestureState.value !== State.FAILED && states[activeId].value !== 'acting') {
              return;
            }
            if (states[activeId]) {
              states[activeId].value = 'resting';
            }
            // for (const [id, offset] of Object.entries(offsets)) {
            //   console.log({ [id]: [offset.x.value.toFixed(2), offset.y.value.toFixed(2)] });
            // }
          }
        );
      })
      .withTestId('DndProvider.pan');

    if (simultaneousHandlers) {
      panGesture.simultaneousWithExternalGesture(simultaneousHandlers);
    }

    if (waitFor) {
      panGesture.requireExternalGestureToFail(waitFor);
    }

    if (gestureRef) {
      panGesture.withRef(gestureRef);
    }

    // Duration in milliseconds of the LongPress gesture before Pan is allowed to activate.
    // If the finger is moved during that period, the gesture will fail.
    if (activationDelay > 0) {
      panGesture.activateAfterLongPress(activationDelay);
    }

    // Minimum distance the finger (or multiple fingers) need to travel before the gesture activates. Expressed in points.
    if (minDistance > 0) {
      panGesture.minDistance(minDistance);
    }

    return panGesture;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  return (
    <DndContext.Provider value={contextValue.current}>
      <GestureDetector gesture={panGesture}>
        <View ref={containerRef} collapsable={false} style={style} testID="view">
          {children}
        </View>
      </GestureDetector>
    </DndContext.Provider>
  );
});
