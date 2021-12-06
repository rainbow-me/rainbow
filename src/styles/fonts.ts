/* eslint-disable sort-keys-fix/sort-keys-fix */
const font = {};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'family' does not exist on type '{}'.
font.family = {
  SFMono: 'SFMono-Regular',
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  SFProRounded: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded',
};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'letterSpacing' does not exist on type '{... Remove this comment to see the full error message
font.letterSpacing = {
  zero: 0,
  roundedTightest: 0.2,
  roundedTighter: 0.3,
  roundedTight: 0.4,
  roundedMedium: 0.5,
  rounded: 0.6,
  uppercase: 0.8,
};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'lineHeight' does not exist on type '{}'.
font.lineHeight = {
  none: 0,
  tightest: 14,
  tight: 16,
  normalTight: 18,
  normal: 20,
  loose: 21,
  looserLoose: 22,
  paragraphSmaller: 24,
  paragraphSmall: 25,
  looser: 26,
  big: 27,
  loosest: 28,
  giant: 108,
};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type '{}'.
font.size = {
  micro: '9px',
  tiny: '11px',
  smaller: '12px',
  small: '13px',
  smedium: '14px',
  medium: '15px',
  lmedium: '16px',
  bmedium: '17px',
  large: '18px',
  larger: '20px',
  big: '23px',
  bigger: '26px',
  biggest: '36px',
  headline: '50px',
  h1: '41px',
  h2: '32px',
  h3: '30px',
  h4: '20px',
  h5: '17px',
  h6: '14px',
};

// react-native requires font weights to be defined as strings
// @ts-expect-error ts-migrate(2339) FIXME: Property 'weight' does not exist on type '{}'.
font.weight = {
  thin: '100',
  ultraLight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
  black: '900',
};

export default font;

export const getFontSize = (key: any) => Number(key.replace('px', ''));
