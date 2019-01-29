import chroma from 'chroma-js';
import PropTypes from 'prop-types';

const base = {
  appleBlue: '#0E76FD', // 14, 118, 253
  black: '#000000', // '0, 0, 0'
  blue: '#657fe6', // '101, 127, 230'
  blueActive: '#5a71cc', // '90, 113, 204'
  blueGreyDark: '#3C4252', // '60, 66, 82'
  blueGreyDarker: '#0F0F11', // '15, 15, 17'
  blueGreyLight: '#A1A5AC', // '102, 106, 115'
  blueGreyLighter: '#888D96', // '136, 141, 150'
  blueGreyMedium: '#636875', // '99, 104, 117'
  blueGreyMediumLight: '#7b7f8a', // '123, 127, 138'
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
  lightestGrey: '#eee9e8', // '238, 233, 232'
  lightGreen: '#54d192', // '84, 209, 146'
  lightGrey: '#f7f7f8', // '247, 247, 248'
  mediumGrey: '#a1a5b3', // '161, 165, 179'
  orange: '#f6851b', // '246, 133, 27'
  orangeLight: '#FFAF24', // '255, 175, 36'
  orangeMedium: '#FCA247', // '252, 162, 71'
  paleBlue: '#5D9DF6',
  placeholder: '#C4C6CB', // 196, 198, 203
  primaryBlue: '#5d9df6', // '93, 157, 246'
  primaryGreen: '#00a352', // '0, 163, 82'
  purple: '#32325d', // '50, 50, 93'
  red: '#d64b47', // '214, 75, 71'
  rowDivider: '#f9f9fa', // '249, 249, 250'
  seaGreen: '#3aa686', // '58, 166, 134'
  skeleton: '#f7f7f8', // '247, 247, 248'
  teal: '#84f8da', // '132, 248, 218'
  transparent: 'transparent',
  white: '#ffffff', // '255, 255, 255'
};

const assetIcon = {
  blue: '#7dabf0', // '125, 171, 240'
  orange: '#f2bb3a', // '242, 187, 58'
  purple: '#464e5e', // '70, 78, 94'
  red: '#c95050', // '201, 80, 80',
};

const sendScreen = {
  brightBlue: base.appleBlue, // 14, 118, 253
  grey: '#d8d8d8', // '216, 216, 216'
  lightGrey: '#fafafa', // '250, 250, 250'
};

assetIcon.random = () => {
  const assetIconColors = Object.values(assetIcon);
  return assetIconColors[Math.floor(Math.random() * assetIconColors.length)];
};

const transparent = {
  purpleTransparent: chroma(base.purple).alpha(0.7), // '50, 50, 93'
  whiteTransparent: chroma(base.white).alpha(0.8), // '255, 255, 255'
};

const vendor = {
  etherscan: '#025c90', // '2, 92, 144'
  ethplorer: '#506685', // '80, 102, 133'
  ledger: '#2f3137', // '47, 49, 55'
  walletconnect: '#4099ff', // '64, 153, 255'
};

const buildRgba = (color, alpha) => `rgba(${chroma(color).rgb()}, ${alpha})`;

const isColorLight = targetColor => (chroma(targetColor || base.white).luminance() > 0.5);

const isHex = (color = '') => ((color.length >= 3) && (color.charAt(0) === '#'));
const isRGB = (color = '') => (color.toLowerCase().substring(0, 3) === 'rgb');

const getTextColorForBackground = (targetColor, textColors = {}) => {
  const {
    dark = base.black,
    light = base.white,
  } = textColors;

  return isColorLight(targetColor) ? dark : light;
};

const colors = {
  alpha: buildRgba,
  assetIcon,
  getTextColorForBackground,
  isColorLight,
  sendScreen,
  ...base,
  ...transparent,
  ...vendor,
};

const getColorForString = (colorString = '') => {
  if (!colorString) return null;

  const isValidColorString = isHex(colorString) || isRGB(colorString);
  return isValidColorString ? colorString : colors[colorString];
};

export default {
  ...colors,
  get: getColorForString,
  propType: PropTypes.oneOf([
    ...Object.keys(colors),
    ...Object.values(colors),
  ]),
};
