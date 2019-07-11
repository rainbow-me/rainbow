const font = {};

font.family = {
  Graphik: 'Graphik',
  SFMono: 'SFMono-Regular',
  SFProDisplay: 'SF Pro Display',
  SFProText: 'SF Pro Text',
};

font.letterSpacing = {
  /* eslint-disable sort-keys */
  tighter: -0.2,
  tight: -0.1,
  loose: 0.15,
  looser: 0.46,
};

font.lineHeight = {
  /* eslint-disable sort-keys */
  none: 0,
  tight: 16,
  normal: 20,
  loose: 21,
  looser: 25,
  loosest: 28,
};

font.size = {
  /* eslint-disable sort-keys */
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
  big: '22px',
  bigger: '26px',
  h1: '42px',
  h2: '30px',
  h3: '24px',
  h4: '20px',
  h5: '17px',
  h6: '14px',
};

// react-native requires font weights to be defined as strings
font.weight = {
  /* eslint-disable sort-keys */
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
