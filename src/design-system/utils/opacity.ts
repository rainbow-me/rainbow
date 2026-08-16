import { convertToRGBA, isColor } from 'react-native-reanimated';

export const opacity = (color: string, opacity: number) => {
  'worklet';

  if (isColor(color)) {
    const rgbaColor = convertToRGBA(color);
    const safeOpacity = opacity < 0.000001 ? 0 : opacity;
    return `rgba(${rgbaColor[0] * 255}, ${rgbaColor[1] * 255}, ${rgbaColor[2] * 255}, ${safeOpacity})`;
  } else {
    return color;
  }
};
