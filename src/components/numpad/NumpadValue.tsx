import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { Text } from '../text';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { ThemeContextProps } from '@/theme';

const FontSizeMultiple = 0.24;
const HeightMultiple = 0.288;

interface WidthParams {
  width: number;
}

const GradientBackground = styled(RadialGradient).attrs(({ width }: WidthParams) => {
  const radius = width - 48;

  return {
    center: [radius, 53.5],
    colors: ['#FFB114', '#FF54BB', '#00F0FF', '#34F3FF'],
    radius,
    stops: [0.2049, 0.6354, 0.8318, 0.9541],
  };
})({
  height: ({ width }: WidthParams) => Math.round(width * HeightMultiple),
  width: '100%',
});

const TextMask = styled(Animated.View)({
  left: '-50%',
  width: '200%',
});

const StyledMaskedView = styled(MaskedView)({
  width: '100%',
});

type ValueTextParams = WidthParams & { theme: ThemeContextProps };

const ValueText = styled(Text).attrs(({ width, theme: { colors } }: ValueTextParams) => ({
  align: 'center',
  color: colors.white,
  letterSpacing: 'roundedTightest',
  lineHeight: Math.round(width * HeightMultiple),
  size: Math.round(width * FontSizeMultiple),
  weight: 'bold',
}))({});

interface Props {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  value: string | number;
}

const NumpadValue = ({ scale, translateX, value }: Props) => {
  const { width } = useDimensions();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateX: translateX.value }],
    };
  });

  const maskElement = (
    <TextMask style={animatedStyle}>
      <ValueText width={width}>{'$' + (value ? value : '0')}</ValueText>
    </TextMask>
  );

  return (
    <StyledMaskedView maskElement={maskElement}>
      <GradientBackground width={width} />
    </StyledMaskedView>
  );
};

export default React.memo(NumpadValue);
