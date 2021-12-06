import MaskedView from '@react-native-community/masked-view';
import React from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import Animated from 'react-native-reanimated';
import styled from 'styled-components';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';

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

const ValueText = styled(Text).attrs(({ width, theme: { colors } }) => ({
  align: 'center',
  color: colors.white,
  letterSpacing: 'roundedTightest',
  lineHeight: Math.round(width * HeightMultiple),
  size: Math.round(width * FontSizeMultiple),
  weight: 'bold',
}))``;

const NumpadValue = ({ scale, translateX, value, ...props }: any) => {
  const { width } = useDimensions();

  const maskElement = (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TextMask style={{ transform: [{ scale, translateX }] }}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ValueText width={width}>{'$' + (value ? value : '0')}</ValueText>
    </TextMask>
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <MaskedView maskElement={maskElement} width="100%" {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <GradientBackground width={width} />
    </MaskedView>
  );
};

export default React.memo(NumpadValue);
