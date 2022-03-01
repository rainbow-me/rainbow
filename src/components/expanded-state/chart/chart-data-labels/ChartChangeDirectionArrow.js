import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Icon } from '../../../icons';
import { useChartData } from '@rainbow-me/animated-charts';
import styled from '@rainbow-me/styled-components';

const AnimatedMaskedView = Animated.createAnimatedComponent(MaskedView);

const ArrowIcon = styled(Icon).attrs({
  direction: 'right',
  name: 'fatArrow',
})({});

export default function ChartChangeDirectionArrow({ ratio, sharedRatio }) {
  const { colors } = useTheme();
  const { isActive } = useChartData();

  const arrowWrapperStyle = useAnimatedStyle(() => {
    const realRatio = isActive.value ? sharedRatio.value : ratio;
    return {
      opacity: realRatio === 1 ? 0 : 1,
      transform: [{ rotate: realRatio < 1 ? '180deg' : '0deg' }],
    };
  }, [ratio]);

  const arrowStyle = useAnimatedStyle(() => {
    const realRatio = isActive.value ? sharedRatio.value : ratio;
    return {
      backgroundColor:
        realRatio === 1
          ? colors.blueGreyDark
          : realRatio < 1
          ? colors.red
          : colors.green,
    };
  }, [ratio]);

  return (
    <Animated.View style={arrowWrapperStyle}>
      <AnimatedMaskedView
        maskElement={<ArrowIcon />}
        style={{ height: 18, width: 15 }}
      >
        <Animated.View
          style={[
            { backgroundColor: '#324376', flex: 1, height: '100%' },
            arrowStyle,
          ]}
        />
      </AnimatedMaskedView>
    </Animated.View>
  );
}
