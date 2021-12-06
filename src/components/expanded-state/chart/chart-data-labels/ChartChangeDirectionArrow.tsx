import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { Icon } from '../../../icons';
import { useRatio } from './useRatio';

const AnimatedMaskedView = Animated.createAnimatedComponent(MaskedView);

const ArrowIcon = styled(Icon).attrs({
  direction: 'right',
  name: 'fatArrow',
})``;

export default function ChartChangeDirectionArrow() {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 1.
  const ratio = useRatio('ChartChangeDirectionArrowRatio');

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const arrowColor = useDerivedValue(() =>
    ratio.value === 1
      ? colors.blueGreyDark
      : ratio.value < 1
      ? colors.red
      : colors.green
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Animated.View style={arrowWrapperStyle}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <AnimatedMaskedView
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        maskElement={<ArrowIcon />}
        style={{ height: 18, width: 15 }}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
