/* eslint-disable sort-keys-fix/sort-keys-fix */

import type { ShadowColor } from '../color/palettes';
import { CustomColor } from '../color/useForegroundColor';

export { shadowColors } from '../color/palettes';

export type { ShadowColor };

export type ShadowValue = {
  color?: ShadowColor | CustomColor;
  offset: {
    x: number;
    y: number;
  };
  opacity: number;
  blur: number;
}[];

export const shadows = {
  '9px medium': [
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
      opacity: 0.12,
    },
    {
      offset: { x: 0, y: 6 },
      blur: 12,
      opacity: 0.04,
    },
  ] as ShadowValue,
  '12px heavy': [
    {
      offset: { x: 0, y: 2 },
      blur: 4,
      opacity: 0.3,
    },
    {
      offset: { x: 0, y: 6 },
      blur: 12,
      opacity: 0.1,
    },
  ] as ShadowValue,
  '21px light': [
    {
      offset: { x: 0, y: 3.5 },
      blur: 10.5,
      opacity: 0.06,
    },
    {
      offset: { x: 0, y: 7 },
      blur: 21,
      opacity: 0.04,
    },
  ] as ShadowValue,
  '21px heavy': [
    {
      offset: { x: 0, y: 3.5 },
      blur: 10.5,
      opacity: 0.35,
    },
    {
      offset: { x: 0, y: 7 },
      blur: 21,
      opacity: 0.25,
    },
  ] as ShadowValue,
  '30px light': [
    {
      offset: { x: 0, y: 5 },
      blur: 15,
      opacity: 0.06,
    },
    {
      offset: { x: 0, y: 10 },
      blur: 30,
      opacity: 0.04,
    },
  ] as ShadowValue,
  '30px medium': [
    {
      offset: { x: 0, y: 5 },
      blur: 15,
      opacity: 0.12,
    },
    {
      offset: { x: 0, y: 10 },
      blur: 30,
      opacity: 0.04,
    },
  ] as ShadowValue,
  '30px heavy': [
    {
      offset: { x: 0, y: 5 },
      blur: 15,
      opacity: 0.4,
    },
    {
      offset: { x: 0, y: 10 },
      blur: 30,
      opacity: 0.2,
    },
  ] as ShadowValue,
} as const;
export type ShadowVariant = keyof typeof shadows;

export type CustomShadow = {
  custom: ShadowValue;
};
export type Shadow = `${ShadowVariant}${'' | ` ${ShadowColor}`}` | CustomShadow;
