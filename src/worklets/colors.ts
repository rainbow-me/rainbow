import { ParsedColorArray, convertToRGBA, processColor } from 'react-native-reanimated';
import { globalColors } from '@/design-system';
import { logger } from '@/logger';

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface LabColor {
  l: number;
  a: number;
  b: number;
  alpha?: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  alpha?: number;
}

/**
 * Convert color to hex string
 */
export function colorToHex(r: number, g: number, b: number): string {
  'worklet';
  return `#${Math.round(r * 255)
    .toString(16)
    .padStart(2, '0')}${Math.round(g * 255)
    .toString(16)
    .padStart(2, '0')}${Math.round(b * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

/**
 * Clamp color value between 0 and 1 (by default)
 */
export function clampColor(v: number, min = 0, max = 1): number {
  'worklet';
  return Math.max(min, Math.min(max, v));
}

/**
 * Converts an sRGB gamma-encoded value to linear space.
 * Optionally clamps the input between 0 and 1.
 *
 * @param value - The sRGB value.
 * @param clampInput - Whether to clamp the value (default false).
 * @returns The linearized value.
 */
export function gammaToLinear(value: number, clampInput = false): number {
  'worklet';
  const x = clampInput ? clampColor(value, 0, 1) : value;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

/**
 * Converts a linear RGB value to gamma-encoded sRGB space.
 *
 * @param value - The linear value.
 * @returns The gamma-encoded value.
 */
export function linearToGamma(value: number): number {
  'worklet';
  if (value <= 0.0031308) return 12.92 * value;
  return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

/**
 * Calculate the luminance of a color
 */
export function getLuminanceWorklet(color: string): number {
  'worklet';
  const processedColor = processColor(color);
  if (processedColor === null || processedColor === undefined) {
    console.warn(`Invalid color input: ${color}`);
    return 0; // Return 0 luminance for invalid colors
  }
  const [r, g, b] = convertToRGBA(processedColor);
  const rLum = gammaToLinear(r);
  const gLum = gammaToLinear(g);
  const bLum = gammaToLinear(b);
  return 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastWorklet(color1: string, color2: string): number {
  'worklet';
  const l1 = getLuminanceWorklet(color1);
  const l2 = getLuminanceWorklet(color2);
  return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
}

/**
 * Get high contrast text color
 */
export function getHighContrastTextColorWorklet(
  backgroundColor: string | undefined,
  minimumContrast?: number,
  isDarkMode?: boolean
): string {
  'worklet';
  if (!backgroundColor) return globalColors.white100;
  const contrastWithWhite = getContrastWorklet(backgroundColor, globalColors.white100);
  if (contrastWithWhite < (minimumContrast || (isDarkMode ? 2.6 : 2))) {
    return globalColors.grey100;
  } else {
    return globalColors.white100;
  }
}

/**
 * Convert color to gamma space
 */
export function toGammaSpace(RGBA: ParsedColorArray, gamma = 2.2): ParsedColorArray {
  'worklet';
  return [Math.pow(RGBA[0], 1 / gamma), Math.pow(RGBA[1], 1 / gamma), Math.pow(RGBA[2], 1 / gamma), RGBA[3]];
}

/**
 * Convert color to linear space
 */
export function toLinearSpace(RGBA: ParsedColorArray, gamma = 2.2): ParsedColorArray {
  'worklet';
  return [Math.pow(RGBA[0], gamma), Math.pow(RGBA[1], gamma), Math.pow(RGBA[2], gamma), RGBA[3]];
}

/**
 * Convert HSV to RGB
 * @param h - Hue (0-1)
 * @param s - Saturation (0-1)
 * @param v - Value (0-1)
 * @returns `{r: red (0-255), g: green (0-255), b: blue (0-255)}`
 */
export function hsvToRgb(h: number, s: number, v: number): RGB {
  'worklet';
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r, g, b;

  switch ((i % 6) as 0 | 1 | 2 | 3 | 4 | 5) {
    case 0:
      [r, g, b] = [v, t, p];
      break;
    case 1:
      [r, g, b] = [q, v, p];
      break;
    case 2:
      [r, g, b] = [p, v, t];
      break;
    case 3:
      [r, g, b] = [p, q, v];
      break;
    case 4:
      [r, g, b] = [t, p, v];
      break;
    case 5:
      [r, g, b] = [v, p, q];
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to HSV
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns `{h: hue (0-1), s: saturation (0-1), v: value (0-1)}`
 */
export function rgbToHsv(r: number, g: number, b: number): HSV {
  'worklet';
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max / 255;

  let h = 0;

  switch (max) {
    case min:
      break;
    case r:
      h = g - b + d * (g < b ? 6 : 0);
      h /= 6 * d;
      break;
    case g:
      h = b - r + d * 2;
      h /= 6 * d;
      break;
    case b:
      h = r - g + d * 4;
      h /= 6 * d;
      break;
  }

  return { h, s, v };
}

/**
 * Properly interpolate between two hues along the shortest path
 */
export function interpolateHue(h1: number, h2: number, t: number): number {
  'worklet';
  // Ensure both hues are in [0, 2π]
  const clampedH1 = (h1 + 2 * Math.PI) % (2 * Math.PI);
  const clampedH2 = (h2 + 2 * Math.PI) % (2 * Math.PI);

  // Determine the shortest path
  let delta = clampedH2 - clampedH1;

  // If the distance is more than 180 degrees, go the other way
  if (Math.abs(delta) > Math.PI) {
    delta = delta - Math.sign(delta) * 2 * Math.PI;
  }

  // Interpolate and normalize to [0, 2π]
  return (clampedH1 + t * delta + 2 * Math.PI) % (2 * Math.PI);
}

/**
 * Check if a color is in RGB gamut
 */
function isInGamut(rgb: { r: number; g: number; b: number }): boolean {
  'worklet';
  return rgb.r >= 0 && rgb.r <= 1 && rgb.g >= 0 && rgb.g <= 1 && rgb.b >= 0 && rgb.b <= 1;
}

/**
 * Convert RGB to Oklab
 */
export function rgbToOklab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  'worklet';
  // Convert RGB to linear RGB
  const lr = gammaToLinear(r, true);
  const lg = gammaToLinear(g, true);
  const lb = gammaToLinear(b, true);

  // Convert to LMS with safety to prevent negative values
  const l = Math.max(1e-8, 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.max(1e-8, 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.max(1e-8, 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  // Apply cubic root
  const lCbrt = Math.cbrt(l);
  const mCbrt = Math.cbrt(m);
  const sCbrt = Math.cbrt(s);

  // Calculate Oklab components
  return {
    L: 0.2104542553 * lCbrt + 0.793617785 * mCbrt - 0.0040720468 * sCbrt,
    a: 1.9779984951 * lCbrt - 2.428592205 * mCbrt + 0.4505937099 * sCbrt,
    b: 0.0259040371 * lCbrt + 0.7827717662 * mCbrt - 0.808675766 * sCbrt,
  };
}

/**
 * Oklab to linear RGB conversion
 */
export function oklabToRgb(L: number, a: number, b: number): { r: number; g: number; b: number } {
  'worklet';
  // Constrain L to prevent numerical issues
  const clampedL = clampColor(L, 0, 1);

  // Calculate LMS from Oklab
  const lCbrt = clampedL + 0.3963377774 * a + 0.2158037573 * b;
  const mCbrt = clampedL - 0.1055613458 * a - 0.0638541728 * b;
  const sCbrt = clampedL - 0.0894841775 * a - 1.291485548 * b;

  // Cube the values
  const l = lCbrt * lCbrt * lCbrt;
  const m = mCbrt * mCbrt * mCbrt;
  const s = sCbrt * sCbrt * sCbrt;

  // Convert to linear RGB
  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  // Delinearize and clamp
  return {
    r: clampColor(linearToGamma(lr)),
    g: clampColor(linearToGamma(lg)),
    b: clampColor(linearToGamma(lb)),
  };
}

/**
 * Convert Oklab to OkLCH (polar form with Lightness, Chroma, Hue)
 */
export function oklabToOklch(L: number, a: number, b: number): { L: number; C: number; H: number } {
  'worklet';
  const C = Math.sqrt(a * a + b * b);
  let H = Math.atan2(b, a);

  // Convert to positive range [0, 2π]
  if (H < 0) H += 2 * Math.PI;

  return { L, C, H };
}

/**
 * Convert OkLCH to Oklab
 */
export function oklchToOklab(L: number, C: number, H: number): { L: number; a: number; b: number } {
  'worklet';
  return {
    L,
    a: C * Math.cos(H),
    b: C * Math.sin(H),
  };
}

/**
 * Helper: binary search for the maximum in-gamut chroma.
 */
function findMaxChroma(oklch: { L: number; C: number; H: number }, precision = 0.001): number {
  'worklet';
  let lo = 0;
  let hi = oklch.C;
  while (hi - lo > precision) {
    const mid = (lo + hi) / 2;
    const { a, b } = oklchToOklab(oklch.L, mid, oklch.H);
    const rgb = oklabToRgb(oklch.L, a, b);
    if (isInGamut(rgb)) {
      lo = mid; // Valid, try a higher chroma.
    } else {
      hi = mid; // Too high, reduce chroma.
    }
  }
  return lo;
}

/**
 * Project a color to the RGB gamut boundary while preserving hue.
 * Uses binary search to find the maximum valid chroma and iteratively adjusts lightness if needed.
 */
export function projectToGamut(
  oklch: { L: number; C: number; H: number },
  { maxAttempts = 5, precision = 0.001 }: { maxAttempts?: number; precision?: number } = {}
): { L: number; C: number; H: number } {
  'worklet';
  // Destructure initial color.
  const H = oklch.H;
  let L = oklch.L;
  let attempts = 0;

  // Try to find a valid chroma; adjust lightness iteratively if chroma is too low.
  while (attempts < maxAttempts) {
    const projectedC = findMaxChroma(oklch, precision);

    if (projectedC >= 0.02) {
      return { L, C: projectedC, H };
    }

    // Adjust lightness toward the middle to allow more chroma.
    L = L < 0.5 ? Math.min(0.9, L + 0.1) : Math.max(0.1, L - 0.1);
    attempts += 1;
  }

  // Fallback if a valid gamut projection couldn't be found.
  return { L: 0.5, C: 0.01, H };
}

/**
 * Standardizes colors to specified lightness and chroma values
 * @param colors Array of OkLCH colors
 * @param options Standardization options
 * @returns Standardized colors
 */
export function standardizeColors(
  colors: Array<{ L: number; C: number; H: number }>,
  options: { lightness?: number; chroma?: number }
): Array<{ L: number; C: number; H: number }> {
  'worklet';
  const { lightness, chroma } = options;

  // If no standardization options are provided, return original colors
  if (lightness === undefined && chroma === undefined) {
    return colors;
  }

  return colors.map(color => {
    const result = { ...color };

    // Apply standardized lightness if specified
    if (lightness !== undefined) {
      result.L = clampColor(lightness, 0, 1);
    }

    // Apply standardized chroma if specified
    if (chroma !== undefined) {
      result.C = Math.max(0, chroma);
    }

    return result;
  });
}

/**
 * Converts an OkLCH color to hex string with gamut mapping
 */
export function oklchToHex({ L, C, H }: { L: number; C: number; H: number }): string {
  'worklet';
  // Project to valid gamut
  const gamutSafe = projectToGamut({ L, C, H });

  // Convert to RGB via Oklab
  const { a, b } = oklchToOklab(gamutSafe.L, gamutSafe.C, gamutSafe.H);
  const { r, g, b: bRgb } = oklabToRgb(gamutSafe.L, a, b);

  // Return hex color
  return colorToHex(r, g, bRgb);
}

/**
 * Calculates a solid color that looks the same as applying a semi-transparent foreground
 * color over a background color
 *
 * @param foreground - The foreground color
 * @param background - The background color
 * @param opacity - The opacity of the foreground color
 * @returns A hex color string that visually matches the blended result
 */
export function getSolidColorEquivalent({
  background,
  foreground,
  opacity,
}: {
  background: string;
  foreground: string;
  opacity: number;
}): string {
  'worklet';
  const processedForeground = processColor(foreground);
  const processedBackground = processColor(background);

  if (processedForeground == null || processedBackground == null) {
    logger.warn('[getSolidColorEquivalent]: Invalid foreground or background color', { foreground, background });
    return background;
  }

  const [fgR, fgG, fgB] = convertToRGBA(processedForeground);
  const [bgR, bgG, bgB] = convertToRGBA(processedBackground);

  const blendedR = fgR * opacity + bgR * (1 - opacity);
  const blendedG = fgG * opacity + bgG * (1 - opacity);
  const blendedB = fgB * opacity + bgB * (1 - opacity);

  return colorToHex(blendedR, blendedG, blendedB);
}
