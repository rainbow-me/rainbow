import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import styled from '@rainbow-me/styled';
import { Icon } from '../../../icons';

const AnimatedMaskedView = Animated.createAnimatedComponent(MaskedView);

const ArrowIcon = styled(Icon).attrs({
  direction: 'right',
  name: 'fatArrow',
})({});

export default function ChartChangeDirectionArrow({ ratio }) {
  const { colors } = useTheme();

  const arrowWrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: ratio.value === 1 ? 0 : 1,
      transform: [{ rotate: ratio.value < 1 ? '180deg' : '0deg' }],
    };
  }, []);

  const arrowStyle = useAnimatedStyle(() => {
    return {
      backgroundColor:
        ratio.value === 1
          ? colors.blueGreyDark
          : ratio.value < 1
          ? colors.red
          : colors.green,
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
