import chroma from 'chroma-js';

import { type ResponseByTheme } from '@/theme/types';

import { globalColors } from './palettes';

const LIGHT_CONTRAST_TARGET = 2.125;

const DARK_CONTRAST_TARGET = 3;
const DARK_LUMINANCE_TARGET = DARK_CONTRAST_TARGET * (chroma(globalColors.blueGrey100).luminance() + 0.05) - 0.05;
const DARK_LIGHTNESS_TARGET = 116 * Math.cbrt(DARK_LUMINANCE_TARGET) - 16;

/**
 * Returns contrast-adjusted accents for both themes, or a color
 * directly when `isDarkMode` is provided as a second argument.
 */
export function getHighContrastColor(color: string): ResponseByTheme<string>;
export function getHighContrastColor(color: string, isDarkMode: boolean): string;
export function getHighContrastColor(color: string, isDarkMode?: boolean): ResponseByTheme<string> | string {
  const isValidInput = typeof color === 'string' && !!color;
  const returnThemeColors = isDarkMode === undefined;
  if (!isValidInput) return returnThemeColors ? { light: color, dark: color } : color;

  const parsed = chroma(color);
  const luminance = parsed.luminance();
  const lightContrast = 1.05 / (luminance + 0.05);

  let light = color;
  let dark = color;

  const transformLight = (returnThemeColors || !isDarkMode) && lightContrast < LIGHT_CONTRAST_TARGET;
  const transformDark = (returnThemeColors || isDarkMode) && luminance < DARK_LUMINANCE_TARGET;

  if (transformLight) {
    const lch = parsed.lch();
    const l = lch[0];
    const c = lch[1];
    const h = lch[2];
    const reduction = Math.min(28, Math.max(0, (LIGHT_CONTRAST_TARGET - lightContrast) * (c < 8 ? 32 : 24)));
    light = chroma.lch(l - reduction, c, h).css();
  }

  if (transformDark) {
    const alpha = parsed.alpha();
    const lab = parsed.lab();
    const a = lab[1];
    const b = lab[2];
    let adjusted = chroma.lab(DARK_LIGHTNESS_TARGET, a, b, alpha);

    if (adjusted.clipped()) {
      let lower = 0;
      let upper = 1;

      for (let i = 0; i < 8; i++) {
        const chromaScale = (lower + upper) / 2;
        const candidate = chroma.lab(DARK_LIGHTNESS_TARGET, a * chromaScale, b * chromaScale, alpha);
        if (candidate.clipped()) upper = chromaScale;
        else {
          lower = chromaScale;
          adjusted = candidate;
        }
      }
    }

    dark = adjusted.hex();
  }

  return returnThemeColors ? { light, dark } : isDarkMode ? dark : light;
}
