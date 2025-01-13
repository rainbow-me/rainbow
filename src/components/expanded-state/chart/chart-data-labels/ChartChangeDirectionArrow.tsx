import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import Animated, { DerivedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useChartData } from '@/react-native-animated-charts/src';
import { Icon } from '../../../icons';
import { useTheme } from '@/theme';

const AnimatedMaskedView = Animated.createAnimatedComponent(MaskedView);

const ArrowIcon = () => <Icon direction="right" name="fatArrow" />;

export default function ChartChangeDirectionArrow({ ratio, sharedRatio }: { ratio: number; sharedRatio: DerivedValue<number> }) {
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
      backgroundColor: realRatio === 1 ? colors.blueGreyDark : realRatio < 1 ? colors.red : colors.green,
    };
  }, [ratio]);

  return (
    <Animated.View style={arrowWrapperStyle}>
      <AnimatedMaskedView maskElement={<ArrowIcon />} style={{ height: 18, width: 15 }}>
        <Animated.View style={[{ backgroundColor: '#324376', flex: 1, height: '100%' }, arrowStyle]} />
      </AnimatedMaskedView>
    </Animated.View>
  );
}
