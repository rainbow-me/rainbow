import chroma from 'chroma-js';

const base = {
  black: '#000000', // '0, 0, 0'
  blue: '#657fe6', // '101, 127, 230'
  blueActive: '#5a71cc', // '90, 113, 204'
  blueGreyDark: '#3c4252', // '60, 66, 82'
  blueGreyMedium: '#7b7f8a', // '123, 127, 138'
  blueHover: '#6c87f5', // '108, 135, 245'
  bodyBackground: '#2c2f38', // '44, 47, 56'
  brightGreen: '#12b878', // '18, 184, 120'
  brightGreenHover: '#15c17f', // '21, 193, 127'
  dark: '#0c0c0d', // '12, 12, 13'
  darkGrey: '#71778a', // '113, 119, 138'
  darkText: '#2b2d33', // '43, 45, 51'
  fadedBlue: '#6781e6', // '103, 129, 230'
  gold: '#fabc2d', // '250, 188, 45'
  green: '#00994d', // '0, 153, 77'
  grey: '#a9a9bc', // '169, 169, 188'
  headerTitle: '#aaafbd', // '170, 175, 189'
  lightBlue: '#c5f2ff', // '197, 242, 255'
  lightGreen: '#54d192', // '84, 209, 146'
  lightGrey: '#f7f8fc', // '247, 248, 252'
  mediumGrey: '#a1a5b3', // '161, 165, 179'
  orange: '#f6851b', // '246, 133, 27'
  purple: '#32325d', // '50, 50, 93'
  red: '#d64b47', // '214, 75, 71'
  rowDivider: '#f8f8f8', // '248, 248, 248'
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

export default {
  ...base,
  ...transparent,
  ...vendor,
};
