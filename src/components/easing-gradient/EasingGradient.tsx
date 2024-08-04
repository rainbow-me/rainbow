import React, { memo } from 'react';
import { ViewProps } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useEasingGradient, UseEasingGradientParams } from '@/hooks/useEasingGradient';

interface EasingGradientProps extends UseEasingGradientParams, ViewProps {}

/**
 * ### EasingGradient
 *
 * Renders a linear gradient with easing applied to the color transitions.
 *
 * **Required:**
 * @param endColor The color at the end of the gradient.
 * @param startColor The color at the start of the gradient.
 *
 * **Optional:**
 * @param easing The easing function to apply to the gradient.
 * @param endOpacity The opacity at the end of the gradient.
 * @param endPosition The end position of the gradient ('top', 'bottom', 'left', 'right').
 * @param startOpacity The opacity at the start of the gradient.
 * @param startPosition The start position of the gradient ('top', 'bottom', 'left', 'right'). Defaults to 'top'.
 * @param steps The number of color steps in the gradient. Defaults to 16.
 * @param props Additional ViewProps to apply to the LinearGradient component.
 *
 * @returns A LinearGradient component with the specified easing and color properties.
 *
 * @example
 * ```tsx
 * <EasingGradient
 *   easing={Easing.ease}
 *   endColor="blue"
 *   endOpacity={0.5}
 *   endPosition="bottom"
 *   startColor="red"
 *   startOpacity={1}
 *   startPosition="top"
 *   steps={20}
 * />
 * ```
 */
export const EasingGradient = memo(function EasingGradient({
  easing,
  endColor,
  endOpacity,
  endPosition,
  startColor,
  startOpacity,
  startPosition = 'top',
  steps = 16,
  ...props
}: EasingGradientProps) {
  const { colors, end, locations, start } = useEasingGradient({
    easing,
    endColor,
    endOpacity,
    endPosition,
    startColor,
    startOpacity,
    startPosition,
    steps,
  });

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <LinearGradient colors={colors} end={end} locations={locations} start={start} {...props} />;
});
