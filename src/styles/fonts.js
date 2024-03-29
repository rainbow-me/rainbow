const font = {};

font.family = {
  SFProRounded: ios ? 'SF Pro Rounded' : 'SF-Pro-Rounded',
  SFMono: ios ? 'SF Mono' : 'SF-Mono-Bold',
};

font.letterSpacing = {
  zero: 0,
  roundedTightest: 0.2,
  roundedTighter: 0.3,
  roundedTight: 0.4,
  roundedMedium: 0.5,
  rounded: 0.6,
  uppercase: 0.8,
  one: 1,
};

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

font.size = {
  micro: 8,
  xtiny: 9.5,
  tiny: 11,
  smaller: 12,
  small: 13,
  smedium: 14,
  medium: 15,
  lmedium: 16,
  bmedium: 17,
  large: 18,
  larger: 20,
  big: 23,
  bigger: 26,
  biggest: 36,
  headline: 50,
  h1: 41,
  h2: 32,
  h3: 30,
  h4: 20,
  h5: 17,
  h6: 14,
};

// react-native requires font weights to be defined as strings
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

export const getFontSize = key => (Number.isInteger(key) ? key : Number(key.replace('px', '')));
