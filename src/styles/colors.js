import chroma from 'chroma-js';
import PropTypes from 'prop-types';

const base = {
  appleBlue: '#0E76FD', // 14, 118, 253
  black: '#000000', // '0, 0, 0'
  blueGreyDark: '#3C4252', // '60, 66, 82'
  blueGreyDarker: '#0F0F11', // '15, 15, 17'
  blueGreyLight: '#A1A5AC',
  blueGreyLighter: '#666A73', // '102, 106, 115'
  blueGreyLightest: '#888D96', // '136, 141, 150'
  blueGreyMedium: '#636875', // '99, 104, 117'
  blueGreyMediumLight: '#7b7f8a', // '123, 127, 138'
  brightOrange: '#FFB624', // '255, 182, 36'
  brightRed: '#FF4B19', // '255, 75, 25'
  dark: '#25292E', // '37, 41, 46'
  darkGrey: '#71778a', // '113, 119, 138'
  dodgerBlue: '#575CFF', // '87, 92, 255'
  green: '#00994d', // '0, 153, 77'
  grey: '#a9adb9', // '169, 173, 185'
  highlightBackground: '#F0F7FF', // '240, 247, 255'
  lightestGrey: '#E9EBEF', // '238, 233, 232'
  lightGrey: '#f7f7f8', // '247, 247, 248'
  limeGreen: '#3FCC18', // '58, 166, 134'
  mediumGrey: '#a1a5b3', // '161, 165, 179'
  orangeMedium: '#FCA247', // '252, 162, 71'
  paleBlue: '#579DFF',
  placeholder: '#C4C6CB', // 196, 198, 203
  primaryBlue: '#5d9df6', // '93, 157, 246'
  purple: '#32325d', // '50, 50, 93'
  purpleLight: '#FFD9FE', // '255, 217, 254'
  red: '#d64b47', // '214, 75, 71'
  rowDivider: '#f9f9fa', // '249, 249, 250'
  shimmer: '#edeef1', // '237, 238, 241'
  skeleton: '#f6f7f8', // '246, 247, 248'
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

const getFallbackTextColor = bg => colors.getTextColorForBackground(bg, {
  dark: colors.blueGreyLight,
  light: colors.white,
});

const transparent = {
  blueGreyDarkTransparent: buildRgba(base.blueGreyDark, 0.6),
  purpleTransparent: buildRgba(base.purple, 0.7), // '50, 50, 93'
  whiteTransparent: buildRgba(base.white, 0.8), // '255, 255, 255'
};

const colors = {
  alpha: buildRgba,
  assetIcon,
  getFallbackTextColor,
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
