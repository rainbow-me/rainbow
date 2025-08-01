import { SkPath, SkPoint, Skia } from '@shopify/react-native-skia';
import { convertToRGBA, processColor } from 'react-native-reanimated';
import { hsvToRgb, rgbToHsv } from './colors';

/**
 * Creates a circle path using Skia's SVG string format.
 *
 * @param center - The center point of the circle
 * @param radius - The radius of the circle
 * @returns A Skia path representing a circle
 */
export function getCirclePath(center: SkPoint, radius: number): SkPath {
  'worklet';
  const svg = `
    M ${center.x + radius} ${center.y}
    A ${radius} ${radius} 0 1 0 ${center.x - radius} ${center.y}
    A ${radius} ${radius} 0 1 0 ${center.x + radius} ${center.y} Z
  `;
  const path = Skia.Path.MakeFromSVGString(svg);
  if (path === null) {
    throw new Error('Failed to create circle path');
  }
  return path;
}

export const IDENTITY_MATRIX: SkiaColorMatrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
const BRIGHTNESS_FACTOR = 1;
const SATURATION_FACTOR = 1;

/**
 * Direct color matrix generation that offers true brightness and saturation control
 * without hue shifts. Paints any Skia drawing with the provided color when passed
 * to a `<ColorMatrix>` component's `matrix` prop.
 *
 * @param baseColor - The color to use as the base for the theme
 * @param options.brightness - How bright the color should be (1 = original, >1 = brighter)
 * @param options.saturation - How saturated the color should be (1 = original, >1 = more saturated)
 * @returns A color matrix array for Skia's `<ColorMatrix>` component
 *
 * @example
 * ```tsx
 * const paintMatrix = useMemo(
 *   () => generatePaintMatrix(color, { brightness, saturation }),
 *   [color, brightness, saturation]
 * );
 * return (
 *   <Canvas>
 *     <Paint antiAlias dither>
 *       <SkiaDrawingToPaint />
 *       <ColorMatrix matrix={paintMatrix} />
 *     </Paint>
 *   </Canvas>
 * );
 * ```
 */
export function generatePaintMatrix(
  baseColor: string,
  options: {
    brightness?: number;
    saturation?: number;
  } = {}
): SkiaColorMatrix {
  'worklet';
  // Extract original color components and convert to HSV
  const [r, g, b] = convertToRGBA(baseColor);
  const { h, s, v } = rgbToHsv(r * 255, g * 255, b * 255);

  let { brightness = 1, saturation = 1 } = options;

  // Apply the global adjustment factors
  saturation = 1 + (saturation - 1) * SATURATION_FACTOR;
  brightness = 1 + (brightness - 1) * BRIGHTNESS_FACTOR;

  // Calculate the color, factoring in saturation only
  // (We'll handle brightness separately)
  let targetS = s;

  if (saturation !== 1) {
    if (saturation > 1) {
      // Calculate the full potential new saturation
      const fullSaturation = 1 - (1 - s) / Math.pow(saturation, 1.5);

      // Create a smooth transition based on the original saturation
      // - At s=0 (pure gray): apply almost no saturation increase
      // - At s=0.3 (30% saturated): apply full saturation increase
      // - In between: smooth curve with stronger effect as color gets more saturated
      const transitionFactor = Math.min(1, Math.pow(s / 0.3, 1.5));

      // Calculate the boost as a blend between a tiny increase and the full increase
      const saturationBoost = (fullSaturation - s) * transitionFactor;

      // Apply the scaled boost
      targetS = s + saturationBoost;
    } else {
      // For desaturation, linear scaling works well
      targetS = s * saturation;
    }
  }

  // Get color with adjusted saturation only
  const { r: targetR, g: targetG, b: targetB } = hsvToRgb(h, targetS, v);

  // Convert to 0-1 range
  const targetRNorm = targetR / 255;
  const targetGNorm = targetG / 255;
  const targetBNorm = targetB / 255;

  // The color-transforming part of the matrix (keeping brightness at original level)
  const colorMatrix: SkiaColorMatrix = [
    targetRNorm * 0.2126,
    targetRNorm * 0.7152,
    targetRNorm * 0.0722,
    0,
    0,
    targetGNorm * 0.2126,
    targetGNorm * 0.7152,
    targetGNorm * 0.0722,
    0,
    0,
    targetBNorm * 0.2126,
    targetBNorm * 0.7152,
    targetBNorm * 0.0722,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];

  // Handle brightness by directly modifying the matrix
  if (brightness !== 1) {
    if (brightness > 1) {
      // For brightness > 1 (brightening)
      // Use a combination of two techniques:
      // 1. Scaling the matrix values (multipliers)
      // 2. Adding offset values (additive brightness)

      // Tune the intensity of the brightening effect
      const scaleFactor = 1 + (brightness - 1) * 0.5;
      const offset = (brightness - 1) * 0.05;

      // Apply scaling to all multiplier terms
      for (let i = 0; i < 15; i++) {
        if (i % 5 !== 3 && i % 5 !== 4) {
          // Skip alpha channel and offsets
          colorMatrix[i] *= scaleFactor;
        }
      }

      // Apply offsets - add absolute brightness
      colorMatrix[4] += offset; // Red offset
      colorMatrix[9] += offset; // Green offset
      colorMatrix[14] += offset; // Blue offset
    } else {
      // For brightness < 1 (darkening), simple scaling works fine
      const scaleFactor = brightness;

      // Apply scaling to multiplier terms only
      for (let i = 0; i < 15; i++) {
        if (i % 5 !== 3 && i % 5 !== 4) {
          // Skip alpha channel and offsets
          colorMatrix[i] *= scaleFactor;
        }
      }
    }
  }

  return colorMatrix;
}

/**
 * A 20-number array representing a color matrix.
 */
export type SkiaColorMatrix = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
