import { useMemo, useState } from 'react';
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { lightModeThemeColors } from '../styles/colors';
import useImageMetadata from './useImageMetadata';
import {
  getTokenMetadata,
  getUrlForTrustIconFallback,
  isETH,
  pseudoRandomArrayItemFromString,
} from '@rainbow-me/utils';

function hexToRgb(hex) {
  'worklet';
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const parsed = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(parsed);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

export default function useColorForAsset(
  asset,
  fallbackColor,
  animateOnChange
) {
  const { address, color } = asset;
  const token = getTokenMetadata(address);
  const tokenListColor = token?.color;

  const { color: imageColor } = useImageMetadata(
    getUrlForTrustIconFallback(address)
  );

  const { isDarkMode, colors } = useTheme();

  const colorDerivedFromAddress = useMemo(
    () =>
      isETH(address)
        ? isDarkMode
          ? colors.brighten(lightModeThemeColors.dark)
          : colors.dark
        : pseudoRandomArrayItemFromString(address, colors.avatarColor),
    [address, colors, isDarkMode]
  );

  const result = useMemo(() => {
    let color2Return;
    if (color) {
      color2Return = color;
    } else if (tokenListColor) {
      color2Return = tokenListColor;
    } else if (imageColor) {
      color2Return = imageColor;
    } else if (fallbackColor) {
      color2Return = fallbackColor;
    } else {
      color2Return = colorDerivedFromAddress;
    }
    try {
      return isDarkMode && colors.isColorDark(color2Return)
        ? colors.brighten(color2Return)
        : color2Return;
    } catch (e) {
      return color2Return;
    }
  }, [
    color,
    colorDerivedFromAddress,
    colors,
    fallbackColor,
    imageColor,
    isDarkMode,
    tokenListColor,
  ]);

  if (animateOnChange) {
    /* eslint-disable react-hooks/rules-of-hooks */
    const sharedColor = useSharedValue(result);
    const [[r, g, b]] = useState(() => hexToRgb(result));
    const sharedR = useSharedValue(r);
    const sharedG = useSharedValue(g);
    const sharedB = useSharedValue(b);

    const animatedColor = useDerivedValue(() => {
      const rgb = hexToRgb(sharedColor.value);
      sharedR.value = withTiming(rgb[0]);
      sharedG.value = withTiming(rgb[1]);
      sharedB.value = withTiming(rgb[2]);
      return `rgb(${sharedR.value}, ${sharedG.value}, ${sharedB.value})`;
    });
    /* eslint-enable react-hooks/rules-of-hooks */

    return animatedColor;
  }

  return result;
}
