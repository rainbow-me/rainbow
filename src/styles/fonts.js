const font = {};

font.family = {
  Graphik: 'Graphik',
  SFMono: 'SFMono-Regular',
  SFProDisplay: 'SF Pro Display',
  SFProText: 'SF Pro Text',
};

font.size = {
  micro: '9px',
  tiny: '11px',
  smaller: '12px',
  small: '13px',
  smedium: '14px',
  medium: '15px',
  lmedium: '16px',
  large: '18px',
  big: '22px',
  h1: '42px',
  h2: '30px',
  h3: '24px',
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
