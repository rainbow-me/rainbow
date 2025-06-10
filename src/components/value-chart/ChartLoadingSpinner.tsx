import React, { memo, useEffect } from 'react';
import spinnerImage from '../../assets/chartSpinner.png';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { ImgixImage } from '@/components/images';

type ChartLoadingSpinnerProps = {
  color: string;
  size: number;
};

export const ChartLoadingSpinner = memo(function ChartLoadingSpinner({ color, size }: ChartLoadingSpinnerProps) {
  const spinnerRotation = useSharedValue(0);
  // const spinnerScale = useSharedValue(0);

  useEffect(() => {
    spinnerRotation.value = 0;
    spinnerRotation.value = withRepeat(withTiming(360, { duration: 500, easing: Easing.linear }), -1, false);
    // spinnerScale.value = withTiming(1, timingConfig);
  }, []);

  const spinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spinnerRotation.value}deg` }],
    };
  });

  return (
    // TODO: should be fade + scale animation
    <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(140)}>
      <ImgixImage source={spinnerImage} size={size} resizeMode={ImgixImage.resizeMode.contain} tintColor={color} style={spinnerStyle} />;
    </Animated.View>
  );
});
