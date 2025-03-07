import { RGBA } from './colors';

/*
 * This code is copied from Reanimated 3.17.0, which requires RN 0.75+.
 */

const channelFromLrgb = (c = 0) => {
  'worklet';
  const abs = Math.abs(c);
  if (abs > 0.0031308) {
    return (Math.sign(c) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
  }
  return c * 12.92;
};

const convertLrgbToRgb = ({ r, g, b, alpha }: RGBA): RGBA => {
  'worklet';
  return {
    r: channelFromLrgb(r),
    g: channelFromLrgb(g),
    b: channelFromLrgb(b),
    alpha,
  };
};

const channelToLrgb = (c = 0) => {
  'worklet';
  const abs = Math.abs(c);
  if (abs <= 0.04045) {
    return c / 12.92;
  }
  return (Math.sign(c) || 1) * Math.pow((abs + 0.055) / 1.055, 2.4);
};

const convertRgbToLrgb = ({ r, g, b, alpha }: RGBA) => {
  'worklet';
  return {
    r: channelToLrgb(r),
    g: channelToLrgb(g),
    b: channelToLrgb(b),
    alpha,
  };
};

export const lrgb = {
  convert: {
    fromRgb: convertRgbToLrgb,
    toRgb: convertLrgbToRgb,
  },
};
