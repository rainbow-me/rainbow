/* eslint-disable no-nested-ternary */
import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { darkModeThemeColors } from '../../../styles/colors';
import { useTheme } from '../../../theme/ThemeContext';
import RainbowButtonTypes from './RainbowButtonTypes';
import styled from '@/styled-thing';
import { margin } from '@/styles';
import { magicMemo } from '@/utils';

const RainbowGradientColorsFactory = (darkMode: boolean, disabled: boolean) => ({
  inner: {
    addCash: ['#FFB114', '#FF54BB', '#00F0FF'],
    default: darkModeThemeColors.gradients.rainbow,
    backup: () => {
      if (darkMode) {
        if (disabled) {
          return ['#12131A', '#12131A', '#12131A'];
        }

        return ['#14C7FF', '#7654FF', '#930AFF'];
      }

      if (disabled) {
        return ['#F5F5F5', '#F5F5F5', '#F5F5F5'];
      }

      return ['#14C7FF', '#7654FF', '#930AFF'];
    },
    disabled: darkMode
      ? [darkModeThemeColors.blueGreyDark20, darkModeThemeColors.blueGreyDark20, darkModeThemeColors.blueGreyDark20]
      : ['#B0B3B9', '#B0B3B9', '#B0B3B9'],
  },
  outer: {
    addCash: ['#F5AA13', '#F551B4', '#00E6F5'],
    default: ['#F5AA13', '#F551B4', '#799DD5'],
    backup: () => {
      if (darkMode) {
        if (disabled) {
          return ['#12131A', '#12131A', '#12131A'];
        }

        return ['#14C7FF', '#7654FF', '#930AFF'];
      }

      if (disabled) {
        return ['#F5F5F5', '#F5F5F5', '#F5F5F5'];
      }

      return ['#14C7FF', '#7654FF', '#930AFF'];
    },
    transparent: darkMode ? ['#12131A', '#12131A', '#12131A'] : ['#F5F5F5', '#F5F5F5', '#F5F5F5'],
    disabled: darkMode
      ? [darkModeThemeColors.blueGreyDark20, darkModeThemeColors.blueGreyDark20, darkModeThemeColors.blueGreyDark20]
      : ['#A5A8AE', '#A5A8AE', '#A5A8AE'],
  },
});

const RainbowButtonGradient = styled(RadialGradient).attrs(({ type, width }: any) => ({
  radius: width,
  stops: type === RainbowButtonTypes.addCash ? [0, 0.544872, 1] : [0, 0.774321, 1],
}))({
  position: 'absolute',
  transform: [{ scaleY: 0.7884615385 }],
});

const InnerButton = styled(View)(({ strokeWidth, height, width, theme: { colors }, type, disabled }: any) => ({
  ...margin.object(strokeWidth),
  backgroundColor: colors.dark,
  borderRadius: height / 2 - strokeWidth,
  height: height - strokeWidth * 2,
  width: width - strokeWidth * 2,
  borderWidth: strokeWidth,
  ...(type === RainbowButtonTypes.backup && {
    borderWidth: 1,
    borderColor: disabled ? colors.white : colors.blueGreyDark,
  }),
}));

const InnerGradient = styled(RainbowButtonGradient).attrs(({ disabled, type, gradientColors }: any) => ({
  colors:
    type === RainbowButtonTypes.backup
      ? gradientColors.inner.backup()
      : disabled
        ? gradientColors.inner.disabled
        : type === RainbowButtonTypes.addCash
          ? gradientColors.inner.addCash
          : gradientColors.inner.default,
}))(({ width, height }: any) => ({
  height: width,
  top: -(width - height) / 2,
  width,
}));

const OuterGradient = styled(RainbowButtonGradient).attrs(({ disabled, type, gradientColors }: any) => ({
  colors:
    type === RainbowButtonTypes.backup
      ? gradientColors.outer.backup()
      : disabled
        ? gradientColors.outer.disabled
        : type === RainbowButtonTypes.addCash
          ? gradientColors.outer.addCash
          : gradientColors.outer.default,
}))(({ width, height }: any) => ({
  height: width * 2,
  left: -width / 2,
  top: -(width - height / 2),
  width: width * 2,
  zIndex: -1,
}));

const WrapperView = android
  ? styled(View)({
      height: ({ height }: any) => height,
      overflow: 'hidden',
      position: 'absolute',
      width: ({ width }: any) => width,
    })
  : ({ children }: any) => children;

type RainbowButtonBackgroundProps = {
  disabled: boolean;
  height: number;
  strokeWidth: number;
  type?: RainbowButtonTypes;
  width: number;
};

const RainbowButtonBackground = ({ disabled, height, strokeWidth, type, width }: RainbowButtonBackgroundProps) => {
  const { isDarkMode } = useTheme();

  const gradientColors = RainbowGradientColorsFactory(isDarkMode, disabled);

  const maskElement = <InnerButton height={height} strokeWidth={strokeWidth} disabled={disabled} width={width} type={type} />;
  const innerGradientCenter = [width - strokeWidth * 2, (width - strokeWidth * 2) / 2];
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

export default magicMemo(RainbowButtonBackground, ['height', 'strokeWidth', 'width', 'type', 'disabled']);
