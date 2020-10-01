import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import { Text } from '../text';
import { colors } from '@rainbow-me/styles';

const FontSizeMultiple = 0.24;
const HeightMultiple = 0.288;

const GradientBackground = styled(RadialGradient).attrs(({ width }) => {
  const radius = width - 48;

  return {
    center: [radius, 53.5],
    colors: ['#FFB114', '#FF54BB', '#00F0FF', '#34F3FF'],
    radius,
    stops: [0.2049, 0.6354, 0.8318, 0.9541],
  };
})`
  height: ${({ width }) => Math.round(width * HeightMultiple)};
  width: 100%;
`;

const TextMask = styled(Animated.View)`
  left: -50%;
  width: 200%;
`;

const ValueText = styled(Text).attrs(({ width }) => ({
  align: 'center',
  color: colors.white,
  letterSpacing: 'roundedTightest',
  lineHeight: Math.round(width * HeightMultiple),
  size: Math.round(width * FontSizeMultiple),
  weight: 'bold',
}))``;

const NumpadValue = ({ scale, translateX, value, ...props }) => {
  const { width } = useDimensions();

  const maskElement = (
    <TextMask style={{ transform: [{ scale, translateX }] }}>
      <ValueText width={width}>{'$' + (value ? value : '0')}</ValueText>
    </TextMask>
  );

  return (
    <MaskedView maskElement={maskElement} width="100%" {...props}>
      <GradientBackground width={width} />
    </MaskedView>
  );
};

export default React.memo(NumpadValue);
