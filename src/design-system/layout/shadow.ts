/* eslint-disable sort-keys-fix/sort-keys-fix */

import type { ShadowColor } from '../color/palettes';

export { shadowColors } from '../color/palettes';

export type { ShadowColor };

export type ShadowValue = {
  offset: {
    x: number;
    y: number;
  };
  opacity: number;
  blur: number;
}[];

export const shadows = {
  '9px light': [
    {
      offset: { x: 0, y: 1 },
      blur: 3,
      opacity: 0.12,
    },
    {
      offset: { x: 0, y: 3 },
      blur: 9,
      opacity: 0.04,
    },
  ] as ShadowValue,
  '12px medium': [
    {
      offset: { x: 0, y: 2 },
      blur: 4,
      opacity: 0.04,
    },
    {
      offset: { x: 0, y: 6 },
      blur: 12,
      opacity: 0.12,
    },
  ] as ShadowValue,
  '12px heavy': [
    {
      offset: { x: 0, y: 2 },
      blur: 4,
      opacity: 0.1,
    },
    {
      offset: { x: 0, y: 6 },
      blur: 12,
      opacity: 0.3,
    },
  ] as ShadowValue,
  '30px light': [
    {
      offset: { x: 0, y: 5 },
      blur: 15,
      opacity: 0.03,
    },
    {
      offset: { x: 0, y: 10 },
      blur: 30,
      opacity: 0.06,
    },
  ] as ShadowValue,
  '30px medium': [
    {
      offset: { x: 0, y: 5 },
      blur: 15,
      opacity: 0.06,
    },
    {
      offset: { x: 0, y: 10 },
      blur: 30,
      opacity: 0.12,
    },
  ] as ShadowValue,
  '30px heavy': [
    {
      offset: { x: 0, y: 5 },
      blur: 15,
      opacity: 0.2,
    },
    {
      offset: { x: 0, y: 10 },
      blur: 30,
      opacity: 0.4,
    },
  ] as ShadowValue,
} as const;

type CustomShadow = {
  custom: ShadowValue;
};
export type Shadow = keyof typeof shadows | CustomShadow;
