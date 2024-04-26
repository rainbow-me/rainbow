import { convertToRGBA, processColor } from 'react-native-reanimated';
import { globalColors } from '@/design-system';

// Helper function to convert RGB component to its luminance contribution
function luminanceComponent(x: number): number {
  'worklet';
  const normalizedX = x * 255;
  return normalizedX <= 0.03928 ? normalizedX / 12.92 : Math.pow((normalizedX + 0.055) / 1.055, 2.4);
}

// Function to calculate the luminance of a color
export const getLuminanceWorklet = (color: string): number => {
  'worklet';
  const processedColor = processColor(color);
  if (processedColor === null || processedColor === undefined) {
    console.warn(`Invalid color input: ${color}`);
    return 0; // Return 0 luminance for invalid colors
  }
  const [r, g, b] = convertToRGBA(processedColor);
  const rLum = luminanceComponent(r);
  const gLum = luminanceComponent(g);
  const bLum = luminanceComponent(b);
  return 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;
};

// Function to calculate contrast ratio between two colors
export const getContrastWorklet = (color1: string, color2: string): number => {
  'worklet';
  const l1 = getLuminanceWorklet(color1);
  const l2 = getLuminanceWorklet(color2);
  return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
};

export const getHighContrastTextColorWorklet = (
  backgroundColor: string | undefined,
  minimumContrast?: number,
  isDarkMode?: boolean
): string => {
  'worklet';
  if (!backgroundColor) return globalColors.white100;
  const contrastWithWhite = getContrastWorklet(backgroundColor, globalColors.white100);
  if (contrastWithWhite < (minimumContrast || (isDarkMode ? 2.6 : 2))) {
    return globalColors.grey100;
  } else {
    return globalColors.white100;
  }
};
