import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import { View } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../../context/ThemeContext' was resolve... Remove this comment to see the full error message
import { useTheme } from '../../../context/ThemeContext';
import { darkModeThemeColors } from '../../../styles/colors';
import RainbowButtonTypes from './RainbowButtonTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { margin } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';

const RainbowGradientColorsFactory = (darkMode: any) => ({
  inner: {
    addCash: ['#FFB114', '#FF54BB', '#00F0FF'],
    default: darkModeThemeColors.gradients.rainbow,
    disabled: darkMode
      ? [
          // @ts-expect-error ts-migrate(2551) FIXME: Property 'blueGreyDark20' does not exist on type '... Remove this comment to see the full error message
          darkModeThemeColors.blueGreyDark20,
          // @ts-expect-error ts-migrate(2551) FIXME: Property 'blueGreyDark20' does not exist on type '... Remove this comment to see the full error message
          darkModeThemeColors.blueGreyDark20,
          // @ts-expect-error ts-migrate(2551) FIXME: Property 'blueGreyDark20' does not exist on type '... Remove this comment to see the full error message
          darkModeThemeColors.blueGreyDark20,
        ]
      : ['#B0B3B9', '#B0B3B9', '#B0B3B9'],
  },

  outer: {
    addCash: ['#F5AA13', '#F551B4', '#00E6F5'],
    default: ['#F5AA13', '#F551B4', '#799DD5'],
    disabled: darkMode
      ? [
          // @ts-expect-error ts-migrate(2551) FIXME: Property 'blueGreyDark20' does not exist on type '... Remove this comment to see the full error message
          darkModeThemeColors.blueGreyDark20,
          // @ts-expect-error ts-migrate(2551) FIXME: Property 'blueGreyDark20' does not exist on type '... Remove this comment to see the full error message
          darkModeThemeColors.blueGreyDark20,
          // @ts-expect-error ts-migrate(2551) FIXME: Property 'blueGreyDark20' does not exist on type '... Remove this comment to see the full error message
          darkModeThemeColors.blueGreyDark20,
        ]
      : ['#A5A8AE', '#A5A8AE', '#A5A8AE'],
  },
});

const RainbowGradientColorsDark = RainbowGradientColorsFactory(true);
const RainbowGradientColorsLight = RainbowGradientColorsFactory(false);

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
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'strokeWidth' does not exist on type 'Vie... Remove this comment to see the full error message
  ${({ strokeWidth }) => margin(strokeWidth)}
  background-color: ${({ theme: { colors } }) => colors.dark};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'strokeWidth' does not exist on type 'Vie... Remove this comment to see the full error message
  border-radius: ${({ strokeWidth, height }) => height / 2 - strokeWidth};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'strokeWidth' does not exist on type 'Vie... Remove this comment to see the full error message
  height: ${({ strokeWidth, height }) => height - strokeWidth * 2};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'strokeWidth' does not exist on type 'Vie... Remove this comment to see the full error message
  width: ${({ strokeWidth, width }) => width - strokeWidth * 2};
`;

const InnerGradient = styled(RainbowButtonGradient).attrs(
  ({ disabled, type, gradientColors }) => ({
    colors: disabled
      ? gradientColors.inner.disabled
      : type === RainbowButtonTypes.addCash
      ? gradientColors.inner.addCash
      : gradientColors.inner.default,
  })
)`
  height: ${({ width }) => width};
  top: ${({ height, width }) => -(width - height) / 2};
  width: ${({ width }) => width};
`;

const OuterGradient = styled(RainbowButtonGradient).attrs(
  ({ disabled, type, gradientColors }) => ({
    colors: disabled
      ? gradientColors.outer.disabled
      : type === RainbowButtonTypes.addCash
      ? gradientColors.outer.addCash
      : gradientColors.outer.default,
  })
)`
  height: ${({ width }) => width * 2};
  left: ${({ width }) => -width / 2};
  top: ${({ height, width }) => -(width - height / 2)};
  width: ${({ width }) => width * 2};
`;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const WrapperView = android
  ? // @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
    styled.View`
      overflow: hidden;
      position: absolute;
      height: ${({ height }: any) => height};
      width: ${({ width }: any) => width};
    `
  : ({ children }: any) => children;

const RainbowButtonBackground = ({
  disabled,
  height,
  strokeWidth,
  type,
  width,
}: any) => {
  const { isDarkMode } = useTheme();

  const gradientColors = isDarkMode
    ? RainbowGradientColorsDark
    : RainbowGradientColorsLight;
  const maskElement = (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <InnerButton height={height} strokeWidth={strokeWidth} width={width} />
  );
  const innerGradientCenter = [
    width - strokeWidth * 2,
    (width - strokeWidth * 2) / 2,
  ];
  const outerGradientCenter = [width * 1.5, width];

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <WrapperView height={height} width={width}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <OuterGradient
        center={outerGradientCenter}
        disabled={disabled}
        gradientColors={gradientColors}
        height={height}
        type={type}
        width={width}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <MaskedView maskElement={maskElement}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <InnerGradient
          center={innerGradientCenter}
          disabled={disabled}
          gradientColors={gradientColors}
          height={height}
          type={type}
          width={width}
        />
      </MaskedView>
    </WrapperView>
  );
};

export default magicMemo(RainbowButtonBackground, [
  'height',
  'strokeWidth',
  'width',
]);
