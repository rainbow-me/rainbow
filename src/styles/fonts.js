const font = {};

font.family = {
  Graphik: 'Graphik',
  SFMono: 'SF Mono',
  SFProDisplay: 'SF Pro Display',
  SFProText: 'SF Pro Text',
};

font.size = {
  tiny: '10px',
  small: '12px',
  smedium: '14px',
  medium: '15px',
  large: '18px',
  big: '22px',
  h1: '42px',
  h2: '32px',
  h3: '24px',
  h4: '20px',
  h5: '17px',
  h6: '14px',
};

// react-native requires font weights to be defined as strings
font.weight = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export default font;
