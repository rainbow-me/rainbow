import React from 'react';
import { Box } from '@/design-system';
import { useTheme } from '@/theme';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LayoutChangeEvent } from 'react-native';

type Props = {
  // Between 0 and 1
  progress: number;
  color: string;
};

const COMBINED_HORIZONTAL_PADDING = 4;
const MIN_PROGRESS_WIDTH = 12;

export const RewardsProgressBar: React.FC<Props> = ({ progress, color }) => {
  const { colors } = useTheme();
  const widthValue = useSharedValue(MIN_PROGRESS_WIDTH);

  const animatedStyle = useAnimatedStyle(() => ({
    width: widthValue.value,
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    const maxWidth = event.nativeEvent.layout.width - COMBINED_HORIZONTAL_PADDING;
    const destinationWidth = Math.min(
      Math.max(event.nativeEvent.layout.width * progress - COMBINED_HORIZONTAL_PADDING, MIN_PROGRESS_WIDTH),
      maxWidth
    );

    widthValue.value = withTiming(destinationWidth, {
      duration: 1000,
    });
  };

  return (
    <Box
      width="full"
      borderRadius={8}
      height={{ custom: 20 }}
      padding="2px"
      onLayout={onLayout}
      style={{
        backgroundColor: colors.alpha(color, 0.16),
      }}
    >
      <Box
        as={Animated.View}
        height="full"
        borderRadius={6}
        style={[
          {
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      />
    </Box>
  );
};
