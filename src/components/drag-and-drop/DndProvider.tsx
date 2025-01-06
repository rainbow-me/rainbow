import React, { ComponentType, forwardRef, PropsWithChildren, RefObject, useImperativeHandle, useMemo, useRef } from 'react';
import { LayoutRectangle, StyleProp, View, ViewStyle } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureEventPayload,
  GestureStateChangeEvent,
  GestureType,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  State,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { cancelAnimation, runOnJS, useAnimatedReaction, useSharedValue, type WithSpringConfig } from 'react-native-reanimated';
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
import { animatePointWithSpring, applyOffset, includesPoint, overlapsRectangle, Point, Rectangle } from './utils';

type WaitForRef =
  | React.RefObject<GestureType | undefined>
  | React.RefObject<React.ComponentType | undefined>
  | React.MutableRefObject<GestureType | undefined>;

export type DndProviderProps = {
  activationDelay?: number;
  debug?: boolean;
  disabled?: boolean;
  gestureRef?: React.MutableRefObject<GestureType | undefined>;
  hapticFeedback?: HapticFeedbackTypes;
  minDistance?: number;
  onStart?: (
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
  waitFor?: WaitForRef;
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
    onStart,
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

  const panGesture = useMemo(() => {
    const findActiveLayoutId = (point: Point): UniqueIdentifier | null => {
      'worklet';
      const { x, y } = point;
      const { value: layouts } = draggableLayouts;
      const { value: offsets } = draggableOffsets;
      const { value: options } = draggableOptions;
      for (const [id, layout] of Object.entries(layouts)) {
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
      .onStart(event => {
        const { state, x, y } = event;
        debug && console.log('onStart', { state, x, y });
        const activeId = findActiveLayoutId({ x, y });

        // No item found, ignore gesture.
        if (activeId === null) return;

        panGestureState.value = state;

        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;
        const { value: restingOffsets } = draggableRestingOffsets;
        const { value: states } = draggableStates;

        const activeLayout = layouts[activeId].value;
        const activeOffset = offsets[activeId];
        const restingOffset = restingOffsets[activeId];

        const { value: activeState } = states[activeId];

        onStart?.(event, { activeId, activeLayout: activeLayout });

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
        draggableActiveId.value = activeId;
        draggableActiveLayout.value = applyOffset(activeLayout, {
          x: activeOffset.x.value,
          y: activeOffset.y.value,
        });
        draggableStates.value[activeId].value = 'dragging';
      })
      .onChange(event => {
        const { state, changeX, changeY } = event;
        debug && console.log('onChange:', { state, changeX, changeY });
        // Track current state for cancellation purposes
        panGestureState.value = state;
        const { value: activeId } = draggableActiveId;
        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;

        // Ignore item-free interactions
        if (activeId === null) return;

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
        debug && console.log('onFinalize:', { state, velocityX, velocityY });
        // Track current state for cancellation purposes
        panGestureState.value = state; // can be `FAILED` or `ENDED`
        const { value: activeId } = draggableActiveId;
        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;
        const { value: restingOffsets } = draggableRestingOffsets;
        const { value: states } = draggableStates;

        // Ignore item-free interactions
        if (activeId === null) return;

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
        animatePointWithSpring(activeOffset, [targetX, targetY], [springConfig, springConfig], () => {
          // Cancel if we are interacting again with this item
          if (panGestureState.value !== State.END && panGestureState.value !== State.FAILED && states[activeId].value !== 'acting') {
            return;
          }
          if (states[activeId]) {
            states[activeId].value = 'resting';
          }
        });
        // Reset interaction-related shared state for styling purposes
        draggableActiveId.value = null;
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
