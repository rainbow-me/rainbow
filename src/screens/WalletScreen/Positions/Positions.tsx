import React from 'react';
import { positionsStore } from './PositionsHeader';
import { Position, PositionHeight } from './Position';
import { deviceUtils } from '@/utils';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { usePositionsContext } from './PositionsContext';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { RainbowPosition } from '@/resources/defi/types';
import { Box } from '@/design-system';
import { withPerformanceTracking } from '@/hooks/withPerformanceTracking';

const STABLE_ARRAY: RainbowPosition[] = [];

function PositionsComponent() {
  const { isExpanded } = usePositionsContext();

  const positions = positionsStore(state => state.getData())?.positions || STABLE_ARRAY;

  const positionsContainerStyles = useAnimatedStyle(() => {
    const rows = Math.ceil(positions.length / 2);
    const height = rows * (PositionHeight + 20);
    return {
      height: withTiming(isExpanded.value ? height : 0, TIMING_CONFIGS.fadeConfig),
      opacity: withTiming(isExpanded.value ? 1 : 0, TIMING_CONFIGS.fadeConfig),
      pointerEvents: isExpanded.value ? 'auto' : 'none',
    };
  });

  if (!positions.length) return null;

  return (
    <Animated.View
      style={[
        positionsContainerStyles,
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          width: deviceUtils.dimensions.width,
        },
      ]}
    >
      {positions.map((position, index) => (
        <Box
          key={`position-${position.type}-${index}`}
          width={{ custom: (deviceUtils.dimensions.width - 60) / 2 }}
          marginBottom={{ custom: 20 }}
        >
          <Position position={position} />
        </Box>
      ))}
    </Animated.View>
  );
}

export const Positions = withPerformanceTracking(PositionsComponent);
