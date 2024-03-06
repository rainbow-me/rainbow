import {
  backgroundColors as rootBackgroundColors,
  deprecatedColors as rootColors,
  foregroundColors as rootForegroundColors,
} from '../../color/palettes';
import { typeHierarchy } from './typography.css';

export const space = {
  'none': '0',
  '2px': '2px',
  '4px': '4px',
  '8px': '8px',
  '12px': '12px',
  '16px': '16px',
  '24px': '24px',
  '32px': '32px',
  '40px': '40px',
  '48px': '48px',
  '64px': '64px',
};

export type Space = keyof typeof space;

export const negativeSpace = {
  'auto': 'auto',
  'none': '0',
  '-2px': '-2px',
  '-4px': '-4px',
  '-8px': '-8px',
  '-12px': '-12px',
  '-16px': '-16px',
  '-24px': '-24px',
  '-32px': '-32px',
  '-40px': '-40px',
  '-48px': '-48px',
  '-64px': '-64px',
};

export type NegativeSpace = keyof typeof negativeSpace;

export const colors = {
  ...rootColors,
  skyTint: 'rgb(233, 242, 255)',
  appleBlueTint: '#c7e0ff',
  appleBlueDark: '#024397',
  appleBlueShade: '#162544',
  white05: 'rgba(0, 0, 0, 0.05)',
  black05: 'rgba(255, 255, 255, 0.05)',
} as const;

export const foregroundColors = {
  ...rootForegroundColors,
  'actionShade (Deprecated)': {
    light: colors.appleBlueDark,
    dark: colors.sky,
  },
};

export type ForegroundColor = keyof typeof foregroundColors;

export const backgroundColors = {
  ...rootBackgroundColors,
  'bodyTint (Deprecated)': { light: colors.white05, dark: colors.black05 },
  'body (Deprecated)': {
    light: colors.skyTint,
    dark: colors.blackTint,
  },
  'actionTint (Deprecated)': {
    light: colors.appleBlueTint,
    dark: colors.appleBlueShade,
  },
  'action (Deprecated)': colors.appleBlue,
};

export const fontSizes = [...Object.keys(typeHierarchy.heading), ...Object.keys(typeHierarchy.text)] as (
  | keyof typeof typeHierarchy.heading
  | keyof typeof typeHierarchy.text
)[];

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export type FontWeight = keyof typeof fontWeights;

export const radii = {
  '4px': '4px',
  '16px': '16px',
};

export type Radii = keyof typeof radii;
