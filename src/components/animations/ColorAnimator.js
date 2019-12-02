/* eslint-disable sort-keys */
import Animated from 'react-native-reanimated';

const { round, interpolate, Extrapolate, color } = Animated;

const colorRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

const hexToRgb = hex => {
  const result = colorRegex.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const white = { r: 255, g: 255, b: 255 };

export const interpolateColors = (animationValue, inputRange, hexColors) => {
  const colors = hexColors.map(hexColor => hexToRgb(hexColor) || white);
  const r = round(
    interpolate(animationValue, {
      inputRange,
      outputRange: colors.map(c => c.r),
      extrapolate: Extrapolate.CLAMP,
    })
  );
  const g = round(
    interpolate(animationValue, {
      inputRange,
      outputRange: colors.map(c => c.g),
      extrapolate: Extrapolate.CLAMP,
    })
  );
  const b = round(
    interpolate(animationValue, {
      inputRange,
      outputRange: colors.map(c => c.b),
      extrapolate: Extrapolate.CLAMP,
    })
  );
  return color(r, g, b);
};
