import React, { type FunctionComponent, type PropsWithChildren } from 'react';
import { type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, type AnimatedProps } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { IS_IOS } from '@/env';
import { useDraggable, type DraggableConstraints, type UseDroppableOptions } from '../hooks';
import type { AnimatedStyleWorklet } from '../types';

export type DraggableProps = AnimatedProps<ViewProps> &
  UseDroppableOptions &
  Partial<DraggableConstraints> & {
    animatedStyleWorklet?: AnimatedStyleWorklet;
    activeOpacity?: number;
    activeScale?: number;
    dragDirection?: 'x' | 'y';
  };

/**
 * Draggable is a React functional component that can be used to create elements that can be dragged within a Drag and Drop context.
 *
 * @component
 * @example
 * <Draggable id="draggable-1" data={{ label: "Example" }}>
 *   <Text>Drag me!</Text>
 * </Draggable>
 *
 * @param {object} props - The properties that define the Draggable component.
 * @param {number} props.activationDelay - A number representing the duration, in milliseconds, that this draggable item needs to be held for before allowing a drag to start.
 * @param {number} props.activationTolerance - A number representing the distance, in pixels, of motion that is tolerated before the drag operation is aborted.
 * @param {number} props.activeOpacity - A number that defines the opacity of the Draggable component when it is active.
 * @param {number} props.activeScale - A number that defines the scale of the Draggable component when it is active.
 * @param {Function} props.animatedStyleWorklet - A worklet function that modifies the animated style of the Draggable component.
 * @param {object} props.data - An object that contains data associated with the Draggable component.
 * @param {boolean} props.disabled - A flag that indicates whether the Draggable component is disabled.
 * @param {string} props.dragDirection - Locks the drag direction to the x or y axis.
 * @param {string} props.id - A unique identifier for the Draggable component.
 * @param {object} props.style - An object that defines the style of the Draggable component.
 * @returns {React.Component} Returns a Draggable component that can be moved by the user within a Drag and Drop context.
 */
export const Draggable: FunctionComponent<PropsWithChildren<DraggableProps>> = ({
  activationDelay,
  activationTolerance,
  activeOpacity = 1,
  activeScale = 1.05,
  animatedStyleWorklet,
  children,
  data,
  disabled,
  dragDirection,
  id,
  style,
  ...otherProps
}) => {
  const { setNodeRef, onLayout, onLayoutWorklet, offset, state } = useDraggable({
    id,
    data,
    disabled,
    activationDelay,
    activationTolerance,
  });

  const animatedStyle = useAnimatedStyle(() => {
    const isSleeping = state.value === 'sleeping';
    const isActive = state.value === 'dragging';
    const isActing = state.value === 'acting';
    // eslint-disable-next-line no-nested-ternary
    const zIndex = isActive ? 999 : isActing ? 998 : 1;
    const style = {
      opacity: withTiming(isActive ? activeOpacity : 1, TIMING_CONFIGS.tabPressConfig),
      zIndex,
      transform: [
        {
          translateX:
            // eslint-disable-next-line no-nested-ternary
            dragDirection !== 'y'
              ? isActive || isSleeping
                ? offset.x.value
                : withTiming(offset.x.value, TIMING_CONFIGS.slowestFadeConfig)
              : 0,
        },
        {
          translateY:
            // eslint-disable-next-line no-nested-ternary
            dragDirection !== 'x'
              ? isActive || isSleeping
                ? offset.y.value
                : withTiming(offset.y.value, TIMING_CONFIGS.slowestFadeConfig)
              : 0,
        },
        { scale: activeScale === undefined ? 1 : withTiming(isActive ? activeScale : 1, TIMING_CONFIGS.tabPressConfig) },
      ],
    };
    if (animatedStyleWorklet) {
      Object.assign(style, animatedStyleWorklet(style, { isActive, isActing, isDisabled: !!disabled }));
    }
    return style;
  }, [id, state, activeOpacity, activeScale]);

  return (
    <Animated.View
      onLayout={onLayout}
      // @ts-expect-error onLayoutWorklet prop is arbitrarily named, we just need to pass setNodeLayout via some prop
      onLayoutWorklet={IS_IOS ? onLayoutWorklet : undefined}
      ref={setNodeRef}
      style={[style, animatedStyle]}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    >
      {children}
    </Animated.View>
  );
};
