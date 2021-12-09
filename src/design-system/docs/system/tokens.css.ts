/* eslint-disable sort-keys-fix/sort-keys-fix */
import merge from 'lodash/merge';
import { palettes } from '../../color/palettes';
import { typeHierarchy as appTypeHierarchy } from '../../typography/typeHierarchy';

export const space = {
  none: '0', // eslint-disable-line prettier/prettier
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
  auto: 'auto', // eslint-disable-line prettier/prettier
  none: '0', // eslint-disable-line prettier/prettier
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

export const textColors = {
  white: 'white',
  action: palettes.light.foregroundColors.action,
  actionShade: '#024397',
  primary: palettes.light.foregroundColors.primary,
  secondary: palettes.light.foregroundColors.secondary60,
};

export type TextColor = keyof typeof textColors;

export const backgroundColors = {
  docs: '#e9f2ff',
  primaryTint: '#d6dfea',
  actionTint: '#c7e0ff',
  action: palettes.light.backgroundColors.action.color,
  bodyDark: palettes.dark.backgroundColors.body.color,
};

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
} as const;

export type FontWeight = keyof typeof fontWeight;

const docsTypeHierarchy = {
  heading: {
    '32px': {
      fontSize: 32,
      letterSpacing: 0.6,
      lineHeight: 36,
    },
  },
} as const;

export const typeHierarchy = merge(appTypeHierarchy, docsTypeHierarchy);

export const radii = {
  '4px': '4px',
  '16px': '16px',
};

export type Radii = keyof typeof radii;
