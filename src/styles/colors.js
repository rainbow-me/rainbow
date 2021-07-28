import chroma from 'chroma-js';
import { toLower } from 'lodash';
import PropTypes from 'prop-types';
import currentColors from '../context/currentColors';

const buildRgba = (color, alpha = 1) => `rgba(${chroma(color).rgb()},${alpha})`;

const darkModeColors = {
  appleBlue: '#0E76FD',
  black: '#FFFFFF',
  blueGreyDark: '#E0E8FF',
  blueGreyDark04: '#222326',
  blueGreyDark20: '#3A3D45',
  blueGreyDark30: '#50535E',
  blueGreyDark40: '#646876',
  blueGreyDark50: '#797D8B',
  blueGreyDarker: '#000000',
  blueGreyDarkLight: '#1E2027',
  brightRed: '#FF5252',
  dark: '#E0E8FF',
  darkGrey: '#333333',
  darkModeDark: '#404656',
  green: '#00D146',
  grey: '#333333',
  grey20: '#333333',
  lighterGrey: '#12131A',
  lightestGrey: '#FFFFFF',
  lightGrey: '#333333',
  offWhite: '#1F222A',
  offWhite80: '#1C1F27',
  rowDivider: 'rgba(60, 66, 82, 0.075)',
  rowDividerExtraLight: 'rgba(60, 66, 82, 0.0375)',
  rowDividerFaint: 'rgba(60, 66, 82, 0.025)',
  rowDividerLight: 'rgba(60, 66, 82, 0.05)',
  shadow: '#000000',
  shadowBlack: '#000000',
  shadowGrey: '#000000',
  shimmer: '#1F2229',
  skeleton: '#191B21',
  stackBackground: '#000000',
  white: '#12131A',
  whiteLabel: '#FFFFFF',
};

const isHex = (color = '') => color.length >= 3 && color.charAt(0) === '#';
const isRGB = (color = '') => toLower(color).substring(0, 3) === 'rgb';

const avatarBackgrounds = [
  '#FC5C54',
  '#FFD95A',
  '#E95D72',
  '#6A87C8',
  '#5FD0F3',
  '#75C06B',
  '#FFDD86',
  '#5FC6D4',
  '#FF949A',
  '#FF8024',
  '#9BA1A4',
  '#EC66FF',
  '#FF8CBC',
  '#FF9A23',
  '#C5DADB',
  '#A8CE63',
  '#71ABFF',
  '#FFE279',
  '#B6B1B6',
  '#FF6780',
  '#A575FF',
  '#4D82FF',
  '#FFB35A',
];

const getColorsByTheme = darkMode => {
  let base = {
    appleBlue: '#0E76FD', // '14, 118, 253'
    black: '#000000', // '0, 0, 0'
    blueGreyDark: '#3C4252', // '60, 66, 82'
    blueGreyDark30: '#C5C6CB', // this color is blueGreyDark at 30% over white
    blueGreyDark40: '#B1B3BA', // this color is blueGreyDark at 40% over white
    blueGreyDark50: '#9DA0A8', // this color is blueGreyDark at 50% over white
    blueGreyDark60: '#898D97', // this color is blueGreyDark at 60% over white
    blueGreyDark80: '#636875', // this color is blueGreyDark at 80% over white
    blueGreyDarker: '#0F0F11', // '15, 15, 17'
    blueGreyDarkLight: '#F3F4F5', // '243, 244, 245'
    brightRed: '#FF7171', // '255, 113, 113'
    chartGreen: '#66D28F', // '102, 210, 143'
    dark: '#25292E', // '37, 41, 46'
    darkGrey: '#71778A', // '113, 119, 138'
    dpiDark: '#8150E6', // '129, 80, 230'
    dpiLight: '#9B74EC', // '155, 116, 236'
    dpiMid: '#8E62E9', // '142, 98, 233'
    flamingo: '#E540F1', // '229, 64, 241'
    green: '#2CCC00', // '58, 166, 134'
    grey: '#A9ADB9', // '169, 173, 185'
    grey20: '#333333', // '51, 51, 51'
    lighterGrey: '#F7F7F8', // '247, 247, 248'
    lightestGrey: '#E9EBEF', // '238, 233, 232'
    lightGrey: '#CDCFD4', // '205, 207, 212'
    mediumGrey: '#A1A5B3', // '161, 165, 179'
    mintDark: '#00E0A9', // '0, 224, 169'
    neonSkyblue: '#34FFFF', // '52, 255, 255'
    offWhite: '#F8F9FA', // '248, 249, 250'
    orange: '#F46E38', // '244, 110, 56'
    orangeLight: '#FEBE44', // '254, 190, 68'
    paleBlue: '#579DFF', // 87, 157, 255
    pink: '#FF54BB', // 255, 84, 187
    pinkLight: '#FF75E8', // '255, 117, 232'
    purple: '#735CFF', // '115, 92, 255'
    purpleDark: '#6F00A3', // '111, 0, 163'
    purpleLight: '#FFD9FE', // '255, 217, 254'
    purpleUniswap: '#FF007A', // '255,0,122'
    red: '#FF494A', // '255, 73, 74'
    rowDivider: 'rgba(60, 66, 82, 0.03)', // '60, 66, 82, 0.03'
    rowDividerExtraLight: 'rgba(60, 66, 82, 0.015)', // '60, 66, 82, 0.015'
    rowDividerFaint: 'rgba(60, 66, 82, 0.01)', // '60, 66, 82, 0.01'
    rowDividerLight: 'rgba(60, 66, 82, 0.02)', // '60, 66, 82, 0.02'
    shadow: '#25292E', // '37, 41, 46'
    shadowBlack: '#000000', // '0, 0, 0'
    shadowGrey: '#6F6F6F', // '111, 111, 111'
    shimmer: '#EDEEF1', // '237, 238, 241'
    skeleton: '#F6F7F8', // '246, 247, 248'
    stackBackground: '#0A0A0A', // '10, 10, 10'
    swapPurple: '#575CFF', // '87, 92, 255'
    transparent: 'transparent',
    trueBlack: '#000000', // '0, 0, 0'
    uniswapPink: '#DC6BE5', // '229, 64, 241',
    white: '#FFFFFF', // '255, 255, 255'
    whiteLabel: '#FFFFFF', // '255, 255, 255'
    yellow: '#FFD657', // '255, 214, 87'
    yellowFavorite: '#FFB200', // '255, 178, 0'
    yellowOrange: '#FFC400', // '255, 196, 0'
  };

  const avatarColor = [
    '#FF494A', // '255, 73, 74'
    '#01D3FF', // '2, 211, 255'
    '#FB60C4', // '251, 96, 196'
    '#3F6AFF', // '63, 106, 255'
    '#FFD963', // '255, 217, 99'
    '#B140FF', // '177, 64, 255'
    '#41EBC1', // '64, 235, 193'
    base.orange,
    '#6D7E8F', // '109, 126, 143'
  ];

  const assetIcon = {
    blue: '#7DABF0', // '125, 171, 240'
    orange: '#F2BB3A', // '242, 187, 58'
    purple: '#464E5E', // '70, 78, 94'
    red: '#C95050', // '201, 80, 80',
  };

  let networkColors = {
    arbitrum: '#2D374B',
    goerli: '#f6c343',
    kovan: '#7057ff',
    mainnet: '#0E76FD',
    optimism: '#FF4040',
    polygon: '#8247E5',
    rinkeby: '#f6c343',
    ropsten: '#ff4a8d',
  };

  let gradients = {
    lighterGrey: [buildRgba('#ECF1F5', 0.15), buildRgba('#DFE4EB', 0.5)],
    lightestGrey: ['#FFFFFF', '#F2F4F7'],
    lightGrey: [buildRgba('#ECF1F5', 0.5), buildRgba('#DFE4EB', 0.5)],
    lightGreyWhite: [buildRgba('#F0F2F5', 0.5), buildRgba('#FFFFFF', 0.5)],
    offWhite: [base.white, base.offWhite],
    rainbow: ['#FFB114', '#FF54BB', '#7EA4DE'],
    savings: ['#FFFFFF', '#F7F9FA'],
    searchBar: ['#FCFDFE', '#F0F2F5'],
    sendBackground: ['#FAFAFA00', '#FAFAFAFF'],
    whiteButton: ['#FFFFFF', '#F7F9FA'],
  };

  const sendScreen = {
    brightBlue: base.appleBlue, // '14, 118, 253'
    grey: '#D8D8D8', // '216, 216, 216'
    lightGrey: '#FAFAFA', // '250, 250, 250'
  };

  let listHeaders = {
    firstGradient: '#ffffff00',
    secondGradient: '#ffffff80',
    thirdGradient: '#ffffff00',
  };

  const light = {
    clearBlue: buildRgba(base.appleBlue, 0.06),
    clearGrey: buildRgba(base.blueGreyDark, 0.06),
  };

  assetIcon.random = () => {
    const assetIconColors = Object.values(assetIcon);
    return assetIconColors[Math.floor(Math.random() * assetIconColors.length)];
  };

  const vendor = {
    etherscan: '#025C90', // '2, 92, 144'
    ethplorer: '#506685', // '80, 102, 133'
    ledger: '#2F3137', // '47, 49, 55'
    walletconnect: '#4099FF', // '64, 153, 255'
  };

  const isColorLight = targetColor =>
    chroma(targetColor || base.white).luminance() > 0.5;

  const getTextColorForBackground = (targetColor, textColors = {}) => {
    const { dark = base.black, light = base.white } = textColors;

    return isColorLight(targetColor) ? dark : light;
  };

  const getFallbackTextColor = bg =>
    colors.getTextColorForBackground(bg, {
      dark: colors.alpha(colors.blueGreyDark, 0.5),
      light: colors.whiteLabel,
    });

  const isColorDark = targetColor => {
    return (
      chroma.contrast(targetColor, darkModeColors.white) < 1.5 ||
      chroma(targetColor || base.white).luminance() < 0.11
    );
  };

  const brighten = targetColor =>
    chroma(targetColor).brighten(2).saturate(0.3).hex();

  const transparent = {
    appleBlueTransparent: buildRgba(base.appleBlue, 0.2), // '50, 50, 93'
    purpleTransparent: buildRgba(base.purple, 0.7), // '50, 50, 93'
    whiteTransparent: buildRgba(base.white, 0.8), // '255, 255, 255'
  };

  if (darkMode) {
    base = {
      ...base,
      ...darkModeColors,
    };

    gradients = {
      lighterGrey: [buildRgba('#1F222A', 0.8), buildRgba('#1F222A', 0.6)],
      lightestGrey: [buildRgba('#1F222A', 0.8), buildRgba('#1F222A', 0.3)],
      lightGrey: ['#1F222A', buildRgba('#1F222A', 0.8)],
      lightGreyWhite: [buildRgba('#F0F2F5', 0.05), buildRgba('#FFFFFF', 0.01)],
      offWhite: ['#1F222A', '#1F222A'],
      rainbow: ['#FFB114', '#FF54BB', '#7EA4DE'],
      savings: ['#1F222A', '#1F222A'],
      searchBar: [buildRgba('#1F222A', 0.4), '#1F222A'],
      sendBackground: ['#12131A00', '#12131AFF'],
      whiteButton: ['#404656', buildRgba('#404656', 0.8)],
    };

    listHeaders = {
      firstGradient: '#12131Aff',
      secondGradient: '#12131A80',
      thirdGradient: '#12131Aff',
    };

    networkColors = {
      arbitrum: '#96BEDC',
      goerli: '#f6c343',
      kovan: '#7057ff',
      mainnet: '#0E76FD',
      optimism: '#FF4040',
      polygon: '#8247E5',
      rinkeby: '#f6c343',
      ropsten: '#ff4a8d',
    };
  }

  return {
    alpha: buildRgba,
    assetIcon,
    avatarBackgrounds,
    avatarColor,
    brighten,
    getFallbackTextColor,
    getTextColorForBackground,
    gradients,
    isColorDark,
    isColorLight,
    listHeaders,
    networkColors,
    sendScreen,
    ...base,
    ...transparent,
    ...light,
    ...vendor,
  };
};

const getColorForString = (colorString = '', providedThemeColors = colors) => {
  if (!colorString) return null;

  const isValidColorString = isHex(colorString) || isRGB(colorString);
  return isValidColorString ? colorString : providedThemeColors[colorString];
};

export const darkModeThemeColors = getColorsByTheme(true);
export const lightModeThemeColors = getColorsByTheme(false);
const colors = currentColors.themedColors || lightModeThemeColors;
export const getRandomColor = () =>
  Math.floor(Math.random() * colors.avatarColor.length);

currentColors.themedColors = lightModeThemeColors;

export default {
  ...colors,
  darkModeColors,
  darkModeThemeColors,
  get: getColorForString,
  getRandomColor,
  lightModeThemeColors,
  propType: PropTypes.oneOf([...Object.keys(colors), ...Object.values(colors)]),
};
