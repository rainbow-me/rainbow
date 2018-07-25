import chroma from 'chroma-js';
import PropTypes from 'prop-types';

const base = {
  black: '#000000', // '0, 0, 0'
  blue: '#657fe6', // '101, 127, 230'
  blueActive: '#5a71cc', // '90, 113, 204'
  blueGreyDark: '#3c4252', // '60, 66, 82'
  blueGreyLight: '#666A73', // '102, 106, 115'
  blueGreyMedium: '#636875', // '99, 104, 117'
  blueHover: '#6c87f5', // '108, 135, 245'
  bodyBackground: '#2c2f38', // '44, 47, 56'
  brightBlue: '#5983FF', // '89, 131, 255'
  brightGreen: '#12b878', // '18, 184, 120'
  brightGreenHover: '#15c17f', // '21, 193, 127'
  dark: '#25292E', // '37, 41, 46'
  darkGrey: '#71778a', // '113, 119, 138'
  darkText: '#2b2d33', // '43, 45, 51'
  fadedBlue: '#6781e6', // '103, 129, 230'
  gold: '#fabc2d', // '250, 188, 45'
  green: '#00994d', // '0, 153, 77'
  grey: '#a9adb9', // '169, 173, 185'
  headerTitle: '#aaafbd', // '170, 175, 189'
  lightBlue: '#c5f2ff', // '197, 242, 255'
  lightGreen: '#54d192', // '84, 209, 146'
  lightGrey: '#f7f7f8', // '247, 247, 248'
  mediumGrey: '#a1a5b3', // '161, 165, 179'
  orange: '#f6851b', // '246, 133, 27'
  orangeLight: '#FFAF24', // '255, 175, 36'
  primaryBlue: '#5d9df6', // '93, 157, 246',
  purple: '#32325d', // '50, 50, 93'
  red: '#d64b47', // '214, 75, 71'
  rowDivider: '#f8f8f8', // '248, 248, 248'
  skeleton: '#f7f7f8', // '247, 247, 248'
  teal: '#84f8da', // '132, 248, 218'
  transparent: 'transparent',
  white: '#ffffff', // '255, 255, 255'
};

const transparent = {
  whiteTransparent: chroma(base.white).alpha(0.8), // '255, 255, 255'
  purpleTransparent: chroma(base.purple).alpha(0.7), // '50, 50, 93'
};

const vendor = {
  etherscan: '#025c90', // '2, 92, 144'
  ethplorer: '#506685', // '80, 102, 133'
  ledger: '#2f3137', // '47, 49, 55'
  walletconnect: '#4099ff', // '64, 153, 255'
};

const colors = {
  alpha: (color, alpha) => `rgba(${chroma(color).rgb()}, ${alpha})`,
  ...base,
  ...transparent,
  ...vendor,
};

const getColorForString = (colorString = '') => {
  const isHex = colorString.charAt(0) === '#';
  const isRGB = colorString.toLowerCase().substring(0, 2) === 'rgb';
  return (isHex || isRGB) ? colorString : colors[colorString];
};

export default {
  ...colors,
  get: getColorForString,
  propType: PropTypes.oneOf([
    ...Object.keys(colors),
    ...Object.values(colors),
  ]),
};
