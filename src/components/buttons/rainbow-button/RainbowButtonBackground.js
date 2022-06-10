import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { darkModeThemeColors } from '../../../styles/colors';
import { useTheme } from '../../../theme/ThemeContext';
import RainbowButtonTypes from './RainbowButtonTypes';
import styled from '@rainbow-me/styled-components';
import { margin } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const RainbowGradientColorsFactory = darkMode => ({
  inner: {
    addCash: ['#FFB114', '#FF54BB', '#00F0FF'],
    default: darkModeThemeColors.gradients.rainbow,
    disabled: darkMode
      ? [
          darkModeThemeColors.blueGreyDark20,
          darkModeThemeColors.blueGreyDark20,
          darkModeThemeColors.blueGreyDark20,
        ]
      : ['#B0B3B9', '#B0B3B9', '#B0B3B9'],
  },
  outer: {
    addCash: ['#F5AA13', '#F551B4', '#00E6F5'],
    default: ['#F5AA13', '#F551B4', '#799DD5'],
    disabled: darkMode
      ? [
          darkModeThemeColors.blueGreyDark20,
          darkModeThemeColors.blueGreyDark20,
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
)({
  position: 'absolute',
  transform: [{ scaleY: 0.7884615385 }],
});

const InnerButton = styled(View)(
  ({ strokeWidth, height, width, theme: { colors } }) => ({
    ...margin.object(strokeWidth),
    backgroundColor: colors.dark,
    borderRadius: height / 2 - strokeWidth,
    height: height - strokeWidth * 2,
    width: width - strokeWidth * 2,
  })
);

const InnerGradient = styled(RainbowButtonGradient).attrs(
  ({ disabled, type, gradientColors }) => ({
    colors: disabled
      ? gradientColors.inner.disabled
      : type === RainbowButtonTypes.addCash
      ? gradientColors.inner.addCash
      : gradientColors.inner.default,
  })
)(({ width, height }) => ({
  height: width,
  top: -(width - height) / 2,
  width,
}));

const OuterGradient = styled(RainbowButtonGradient).attrs(
  ({ disabled, type, gradientColors }) => ({
    colors: disabled
      ? gradientColors.outer.disabled
      : type === RainbowButtonTypes.addCash
      ? gradientColors.outer.addCash
      : gradientColors.outer.default,
  })
)(({ width, height }) => ({
  height: width * 2,
  left: -width / 2,
  top: -(width - height / 2),
  width: width * 2,
}));

const WrapperView = android
  ? styled.View({
      height: ({ height }) => height,
      overflow: 'hidden',
      position: 'absolute',
      width: ({ width }) => width,
    })
  : ({ children }) => children;

const RainbowButtonBackground = ({
  disabled,
  height,
  strokeWidth,
  type,
  width,
}) => {
  const { isDarkMode } = useTheme();

  const gradientColors = isDarkMode
    ? RainbowGradientColorsDark
    : RainbowGradientColorsLight;
  const maskElement = (
    <InnerButton height={height} strokeWidth={strokeWidth} width={width} />
  );
  const innerGradientCenter = [
    width - strokeWidth * 2,
    (width - strokeWidth * 2) / 2,
  ];
  const outerGradientCenter = [width * 1.5, width];

  return (
    <WrapperView height={height} width={width}>
      <OuterGradient
        center={outerGradientCenter}
        disabled={disabled}
        gradientColors={gradientColors}
        height={height}
        type={type}
        width={width}
      />
      <MaskedView maskElement={maskElement}>
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
