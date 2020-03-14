/* eslint-disable sort-keys */
const font = {};

font.family = {
  SFMono: 'SFMono-Regular',
  SFProRounded: 'SF Pro Rounded',
};

font.letterSpacing = {
  roundedTightest: 0.2,
  roundedTight: 0.4,
  roundedMedium: 0.5,
  rounded: 0.6,
};

font.lineHeight = {
  none: 0,
  tightest: 14,
  tight: 16,
  normal: 20,
  loose: 21,
  paragraphSmall: 25,
  looser: 26,
  loosest: 28,
};

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
  blarge: '21px',
  big: '23px',
  bigger: '26px',
  biggest: '27px',
  h1: '42px',
  h2: '32px',
  h3: '30px',
  h4: '20px',
  h5: '17px',
  h6: '14px',
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
