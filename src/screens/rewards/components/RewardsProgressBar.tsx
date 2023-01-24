import React from 'react';
import { Box } from '@/design-system';
import { useTheme } from '@/theme';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LayoutChangeEvent } from 'react-native';

type Props = {
  // Between 0 and 1
  progress: number;
};

export const RewardsProgressBar: React.FC<Props> = ({ progress }) => {
  const { colors } = useTheme();

  const widthValue = useSharedValue(10);

  const animatedStyle = useAnimatedStyle(() => ({
    width: widthValue.value,
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    widthValue.value = withTiming(event.nativeEvent.layout.width * progress, {
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
        backgroundColor: colors.alpha(colors.networkColors.optimism, 0.16),
      }}
    >
      <Box
        as={Animated.View}
        height="full"
        borderRadius={6}
        style={[
          {
            backgroundColor: colors.networkColors.optimism,
          },
          animatedStyle,
        ]}
      />
    </Box>
  );
};
