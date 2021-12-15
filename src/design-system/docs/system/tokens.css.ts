/* eslint-disable sort-keys-fix/sort-keys-fix */
import {
  foregroundColors,
  backgroundColors as rootBackgroundColors,
} from '../../color/palettes';
import { typeHierarchy } from './typography.css';

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
  action: foregroundColors.action,
  actionShade: {
    light: '#024397',
    dark: (foregroundColors.primary as any).dark,
  },
  primary: foregroundColors.primary,
  secondary: foregroundColors.secondary60,
};

export type TextColor = keyof typeof textColors;

export const backgroundColors = {
  bodyTint: { light: 'rgba(0, 0, 0, 0.05)', dark: 'rgba(255, 255, 255, 0.05)' },
  body: {
    light: '#e9f2ff',
    dark: (rootBackgroundColors.body as any).dark.color,
  },
  actionTint: { light: '#c7e0ff', dark: '#162544' },
  action: (rootBackgroundColors.action as any).color,
};

export const fontSizes = [
  ...Object.keys(typeHierarchy.heading),
  ...Object.keys(typeHierarchy.text),
] as (keyof typeof typeHierarchy.heading | keyof typeof typeHierarchy.text)[];

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
