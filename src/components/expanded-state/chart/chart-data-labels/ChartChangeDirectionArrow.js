import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { Icon } from '../../../icons';
import { useRatio } from './useRatio';
import { colors } from '@rainbow-me/styles';

const AnimatedMaskedView = Animated.createAnimatedComponent(MaskedView);

const ArrowIcon = styled(Icon).attrs({
  direction: 'right',
  name: 'fatArrow',
})``;

export default function ChartChangeDirectionArrow() {
  const ratio = useRatio('ChartChangeDirectionArrowRatio');

  const arrowColor = useDerivedValue(
    () =>
      ratio.value === 1
        ? colors.blueGreyDark
        : ratio.value < 1
        ? colors.red
        : colors.green,
    [],
    'ChartChangeDirectionArrowRatioColor'
  );
  const arrowWrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: ratio.value === 1 ? 0 : 1,
      transform: [{ rotate: ratio.value < 1 ? '180deg' : '0deg' }],
    };
  });

  const arrowStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: arrowColor.value,
    };
  });

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
