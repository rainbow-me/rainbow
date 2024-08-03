import React, { type FunctionComponent, type PropsWithChildren } from 'react';
import { type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, type AnimatedProps } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { IS_IOS } from '@/env';
import { useDroppable, type UseDraggableOptions } from '../hooks';
import type { AnimatedStyleWorklet } from '../types';

export type DroppableProps = AnimatedProps<ViewProps> &
  UseDraggableOptions & {
    animatedStyleWorklet?: AnimatedStyleWorklet;
    activeOpacity?: number;
    activeScale?: number;
  };

/**
 * Droppable is a React functional component that can be used to create a drop target in a Drag and Drop context.
 *
 * @component
 * @example
 * <Droppable id="droppable-1" data={{ accepts: ["draggable-1"] }}>
 *   <Text>Drop here!</Text>
 * </Droppable>
 *
 * @param {object} props - The properties that define the Droppable component.
 * @param {string} props.id - A unique identifier for the Droppable component.
 * @param {boolean} props.disabled - A flag that indicates whether the Droppable component is disabled.
 * @param {object} props.data - An object that contains data associated with the Droppable component.
 * @param {object} props.style - An object that defines the style of the Droppable component.
 * @param {number} props.activeOpacity - A number that defines the opacity of the Droppable component when it is active.
 * @param {number} props.activeScale - A number that defines the scale of the Droppable component when it is active.
 * @param {Function} props.animatedStyleWorklet - A worklet function that modifies the animated style of the Droppable component.
 * @returns {React.Component} Returns a Droppable component that can serve as a drop target within a Drag and Drop context.
 */
export const Droppable: FunctionComponent<PropsWithChildren<DroppableProps>> = ({
  children,
  id,
  disabled,
  data,
  style,
  activeOpacity = 0.9,
  activeScale,
  animatedStyleWorklet,
  ...otherProps
}) => {
  const { setNodeRef, onLayout, onLayoutWorklet, activeId } = useDroppable({
    id,
    disabled,
    data,
  });

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeId.value === id;
    const style = {
      opacity: withTiming(isActive ? activeOpacity : 1, TIMING_CONFIGS.slowestFadeConfig),
      transform: [{ scale: activeScale === undefined ? 1 : withTiming(isActive ? activeScale : 1, TIMING_CONFIGS.slowestFadeConfig) }],
    };
    if (animatedStyleWorklet) {
      Object.assign(style, animatedStyleWorklet(style, { isActive, isDisabled: !!disabled }));
    }
    return style;
  }, [id, activeOpacity, activeScale]);

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
