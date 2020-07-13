import MaskedView from '@react-native-community/masked-view';
import React, { Fragment } from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components/primitives';
import { magicMemo } from '../../../utils';
import RainbowButtonTypes from './RainbowButtonTypes';
import { colors, margin } from '@rainbow-me/styles';

const RainbowGradientColors = {
  inner: {
    addCash: ['#FFB114', '#FF54BB', '#00F0FF'],
    default: ['#FFB114', '#FF54BB', '#7EA4DE'],
    disabled: ['#B0B3B9', '#B0B3B9', '#B0B3B9'],
  },
  outer: {
    addCash: ['#F5AA13', '#F551B4', '#00E6F5'],
    default: ['#F5AA13', '#F551B4', '#799DD5'],
    disabled: ['#A5A8AE', '#A5A8AE', '#A5A8AE'],
  },
};

const RainbowButtonGradient = styled(RadialGradient).attrs(
  ({ type, width }) => ({
    radius: width,
    stops:
      type === RainbowButtonTypes.addCash ? [0, 0.544872, 1] : [0, 0.774321, 1],
  })
)`
  position: absolute;
  transform: scaleY(0.7884615385);
`;

const InnerButton = styled(View)`
  ${({ strokeWidth }) => margin(strokeWidth)}
  background-color: ${colors.dark};
  border-radius: ${({ strokeWidth, height }) => height / 2 - strokeWidth};
  height: ${({ strokeWidth, height }) => height - strokeWidth * 2};
  width: ${({ strokeWidth, width }) => width - strokeWidth * 2};
`;

const InnerGradient = styled(RainbowButtonGradient).attrs(
  ({ disabled, type }) => ({
    colors: disabled
      ? RainbowGradientColors.inner.disabled
      : type === RainbowButtonTypes.addCash
      ? RainbowGradientColors.inner.addCash
      : RainbowGradientColors.inner.default,
  })
)`
  height: ${({ width }) => width};
  top: ${({ height, width }) => -(width - height) / 2};
  width: ${({ width }) => width};
`;

const OuterGradient = styled(RainbowButtonGradient).attrs(
  ({ disabled, type }) => ({
    colors: disabled
      ? RainbowGradientColors.outer.disabled
      : type === RainbowButtonTypes.addCash
      ? RainbowGradientColors.outer.addCash
      : RainbowGradientColors.outer.default,
  })
)`
  height: ${({ width }) => width * 2};
  left: ${({ width }) => -width / 2};
  top: ${({ height, width }) => -(width - height / 2)};
  width: ${({ width }) => width * 2};
`;

const RainbowButtonBackground = ({
  disabled,
  height,
  strokeWidth,
  type,
  width,
}) => {
  const maskElement = (
    <InnerButton height={height} strokeWidth={strokeWidth} width={width} />
  );
  const innerGradientCenter = [
    width - strokeWidth * 2,
    (width - strokeWidth * 2) / 2,
  ];
  const outerGradientCenter = [width * 1.5, width];

  return (
    <Fragment>
      <OuterGradient
        center={outerGradientCenter}
        disabled={disabled}
        height={height}
        type={type}
        width={width}
      />
      <MaskedView maskElement={maskElement}>
        <InnerGradient
          center={innerGradientCenter}
          disabled={disabled}
          height={height}
          type={type}
          width={width}
        />
      </MaskedView>
    </Fragment>
  );
};

export default magicMemo(RainbowButtonBackground, [
  'height',
  'strokeWidth',
  'width',
]);
