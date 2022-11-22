import chroma from 'chroma-js';
import PropTypes from 'prop-types';
import currentColors from '../theme/currentColors';
import { memoFn } from '../utils/memoFn';

export type Colors = ReturnType<typeof getColorsByTheme>;

const buildRgba = memoFn(
  (color: string, alpha = 1) => `rgba(${chroma(color).rgb()},${alpha})`
);

const darkModeColors = {
  appleBlue: '#1F87FF',
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
  cardBackdrop: '#12131A',
  dark: '#E0E8FF',
  darkGrey: '#333333',
  darkModeDark: '#404656',
  exchangeFallback: 'rgba(60, 66, 82, 0.8)',
  green: '#4BD166',
  grey: '#333333',
  grey20: '#333333',
  lighterGrey: '#12131A',
  lightestGrey: '#FFFFFF',
  lightGrey: '#333333',
  lightOrange: '#FFA64D',
  offWhite: '#1F222A',
  offWhite80: '#1C1F27',
  placeholder: 'rgba(224, 232, 255, 0.4)',
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
  surfacePrimary: '#000000',
  white: '#12131A',
  whiteLabel: '#FFFFFF',
};

const isHex = (color = '') => color.length >= 3 && color.charAt(0) === '#';
const isRGB = memoFn(
  (color: string = '') => color.toLowerCase().substring(0, 3) === 'rgb'
);

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

const getColorsByTheme = (darkMode?: boolean) => {
  let base = {
    appleBlue: '#0E76FD', // '13, 13, 13'
    black: '#000000', // '0, 0, 0'
    blueGreyDark: '#3C4252', // '60, 66, 82'
    blueGreyDark04: '#222326', // this color is blueGreyDark at 4% over white
    blueGreyDark20: '#3A3D45', // this color is blueGreyDark at 20% over white
    blueGreyDark30: '#C5C6CB', // this color is blueGreyDark at 30% over white
    blueGreyDark40: '#B1B3BA', // this color is blueGreyDark at 40% over white
    blueGreyDark50: '#9DA0A8', // this color is blueGreyDark at 50% over white
    blueGreyDark60: '#898D97', // this color is blueGreyDark at 60% over white
    blueGreyDark80: '#636875', // this color is blueGreyDark at 80% over white
    blueGreyDarker: '#0F0F11', // '15, 15, 17'
    blueGreyDarkLight: '#F3F4F5', // '243, 244, 245'
    brightRed: '#FF7171', // '255, 113, 113'
    cardBackdrop: '#F5F5F7', // '245, 245, 247'
    chartGreen: '#66D28F', // '102, 210, 143'
    dark: '#25292E', // '37, 41, 46'
    darkGrey: '#71778A', // '113, 119, 138'
    darkModeDark: '#404656',
    dpiDark: '#8150E6', // '129, 80, 230'
    dpiLight: '#9B74EC', // '155, 116, 236'
    dpiMid: '#8E62E9', // '142, 98, 233'
    exchangeFallback: '#F4F4F5', // '244, 244, 245'
    flamingo: '#E540F1', // '229, 64, 241'
    green: '#2CCC00', // '58, 166, 134'
    grey: '#A9ADB9', // '169, 173, 185'
    grey20: '#333333', // '51, 51, 51'
    lighterGrey: '#F7F7F8', // '247, 247, 248'
    lightestGrey: '#E9EBEF', // '238, 233, 232'
    lightGrey: '#CDCFD4', // '205, 207, 212'
    lightOrange: '#FFA64D', // '255, 166, 77'
    mediumGrey: '#A1A5B3', // '161, 165, 179'
    mintDark: '#00E0A9', // '0, 224, 169'
    neonSkyblue: '#34FFFF', // '52, 255, 255'
    offWhite: '#F8F9FA', // '248, 249, 250'
    offWhite80: '#1C1F27',
    optimismRed: '#FF0420', // '255, 4, 32',
    optimismRed06: 'rgba(255, 4, 32, 0.06)', // '255, 4, 32, 0.06'
    orange: '#F46E38', // '244, 110, 56'
    orangeLight: '#FEBE44', // '254, 190, 68'
    paleBlue: '#579DFF', // 87, 157, 255
    pink: '#FF54BB', // 255, 84, 187
    pinkLight: '#FF75E8', // '255, 117, 232'
    purple: '#735CFF', // '115, 92, 255'
    purpleDark: '#6F00A3', // '111, 0, 163'
    purpleLight: '#FFD9FE', // '255, 217, 254'
    purpleUniswap: '#FF007A', // '255,0,122',
    rainbowBlue: '#001E59', // '0, 30, 89',
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
    smolPurple: '#7D50E6', // '125, 80, 230'
    smolPurple06: 'rgba(125, 80, 230, 0.06)', // '125, 80, 230, 0.06'
    stackBackground: '#000000', // '0, 0, 0'
    surfacePrimary: '#FFFFFF', // '255, 255, 255'
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

  const assetIconColors = {
    blue: '#7DABF0', // '125, 171, 240'
    orange: '#F2BB3A', // '242, 187, 58'
    purple: '#464E5E', // '70, 78, 94'
    red: '#C95050', // '201, 80, 80',
  };

  const assetIcon = {
    ...assetIconColors,
    random: () => {
      const assetIconColorValues = Object.values(assetIconColors);
      return assetIconColorValues[
        Math.floor(Math.random() * assetIconColorValues.length)
      ];
    },
  };

  let networkColors = {
    arbitrum: '#2D374B',
    goerli: '#f6c343',
    mainnet: '#25292E',
    optimism: '#FF4040',
    polygon: '#8247E5',
    bsc: '#F0B90B',
  };

  let gradients = {
    appleBlueTintToAppleBlue: ['#15B1FE', base.appleBlue],
    blueToGreen: ['#4764F7', '#23D67F'],
    checkmarkAnimation: ['#1FC24A10', '#1FC24A10', '#1FC24A00'],
    ens: ['#456AFF', '#5FA9EE'],
    lighterGrey: [buildRgba('#ECF1F5', 0.15), buildRgba('#DFE4EB', 0.5)],
    lightestGrey: ['#FFFFFF', '#F2F4F7'],
    lightestGreyReverse: ['#F2F4F7', '#FFFFFF'],
    lightGrey: [buildRgba('#ECF1F5', 0.5), buildRgba('#DFE4EB', 0.5)],
    lightGreyTransparent: [
      buildRgba(base.blueGreyDark, 0.02),
      buildRgba(base.blueGreyDark, 0.06),
    ],
    lightGreyWhite: [buildRgba('#F0F2F5', 0.5), buildRgba('#FFFFFF', 0.5)],
    offWhite: [base.white, base.offWhite],
    rainbow: ['#FFB114', '#FF54BB', '#7EA4DE'],
    savings: ['#FFFFFF', '#F7F9FA'],
    searchBar: ['#FCFDFE', '#F0F2F5'],
    sendBackground: ['#FAFAFA00', '#FAFAFAFF'],
    success: ['#FAFF00', '#2CCC00'],
    successTint: ['#FFFFF0', '#FCFEFB'],
    swapPurpleTintToSwapPurple: ['#7D85FF', base.swapPurple],
    transparentToAppleBlue: [
      buildRgba(base.appleBlue, 0.02),
      buildRgba(base.appleBlue, 0.06),
    ],
    transparentToGreen: [buildRgba(base.green, 0), buildRgba(base.green, 0.06)],
    transparentToLightGrey: [
      buildRgba(base.blueGreyDark, 0),
      buildRgba(base.blueGreyDark, 0.06),
    ],
    transparentToLightOrange: [
      buildRgba(base.lightOrange, 0),
      buildRgba(base.lightOrange, 0.06),
    ],
    vividRainbow: ['#FFB114', '#FF54BB', '#00F0FF'],
    vividRainbowTint: ['#FFFAF1', '#FFF5FB', '#F0FEFF'],
    warning: ['#FFD963', '#FFB200'],
    warningTint: ['#FFFDF6', '#FFFBF2'],
    white80ToTransparent: [
      buildRgba(base.whiteLabel, 0.8),
      buildRgba(base.whiteLabel, 0),
    ],
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

  const vendor = {
    etherscan: '#025C90', // '2, 92, 144'
    ethplorer: '#506685', // '80, 102, 133'
    ledger: '#2F3137', // '47, 49, 55'
    walletconnect: '#4099FF', // '64, 153, 255'
  };

  const isColorLight = memoFn(
    (targetColor: string) => chroma(targetColor ?? base.white).luminance() > 0.5
  );

  const getTextColorForBackground = (
    targetColor: string,
    textColors?: { dark: string; light: string }
  ) => {
    const dark = textColors?.dark ?? base.black;
    const light = textColors?.light ?? base.white;

    return isColorLight(targetColor) ? dark : light;
  };

  const getFallbackTextColor = (backgroundColor: string) =>
    colors.getTextColorForBackground(backgroundColor, {
      dark: colors.alpha(colors.blueGreyDark, 0.5),
      light: colors.whiteLabel,
    });

  const isColorDark = memoFn((targetColor: string) => {
    return (
      chroma.contrast(targetColor, darkModeColors.white) < 1.5 ||
      chroma(targetColor ?? base.white).luminance() < 0.11
    );
  });

  const brighten = memoFn((targetColor: string) =>
    chroma(targetColor).brighten(2).saturate(0.3).hex()
  );

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
      appleBlueTintToAppleBlue: ['#2FC3FF', base.appleBlue],
      blueToGreen: ['#4764F7', '#23D67F'],
      checkmarkAnimation: ['#1FC24A10', '#1FC24A10', '#1FC24A00'],
      ens: ['#456AFF', '#5FA9EE'],
      lighterGrey: [buildRgba('#1F222A', 0.8), buildRgba('#1F222A', 0.6)],
      lightestGrey: [buildRgba('#1F222A', 0.8), buildRgba('#1F222A', 0.3)],
      lightestGreyReverse: [
        buildRgba('#1F222A', 0.1),
        buildRgba('#1F222A', 0.8),
      ],
      lightGrey: ['#1F222A', buildRgba('#1F222A', 0.8)],
      lightGreyTransparent: [
        buildRgba(base.blueGreyDark, 0.02),
        buildRgba(base.blueGreyDark, 0.06),
      ],
      lightGreyWhite: [buildRgba('#F0F2F5', 0.05), buildRgba('#FFFFFF', 0.01)],
      offWhite: ['#1F222A', '#1F222A'],
      rainbow: ['#FFB114', '#FF54BB', '#7EA4DE'],
      savings: ['#1F222A', '#1F222A'],
      searchBar: [buildRgba('#1F222A', 0.4), '#1F222A'],
      sendBackground: ['#12131A00', '#12131AFF'],
      success: ['#FAFF00', '#2CCC00'],
      successTint: ['#202118', '#141E18'],
      swapPurpleTintToSwapPurple: ['#7D85FF', base.swapPurple],
      transparentToAppleBlue: [
        buildRgba(base.appleBlue, 0.02),
        buildRgba(base.appleBlue, 0.06),
      ],
      transparentToGreen: [
        buildRgba(base.green, 0),
        buildRgba(base.green, 0.06),
      ],
      transparentToLightGrey: [
        buildRgba(base.blueGreyDark, 0),
        buildRgba(base.blueGreyDark, 0.06),
      ],
      transparentToLightOrange: [
        buildRgba(base.lightOrange, 0),
        buildRgba(base.lightOrange, 0.06),
      ],
      vividRainbow: ['#FFB114', '#FF54BB', '#00F0FF'],
      vividRainbowTint: ['#201C19', '#201723', '#112028'],
      warning: ['#FFD963', '#FFB200'],
      warningTint: ['#201F1E', '#201C18'],
      white80ToTransparent: [
        buildRgba(base.whiteLabel, 0.8),
        buildRgba(base.whiteLabel, 0),
      ],
      whiteButton: ['#404656', buildRgba('#404656', 0.8)],
    };

    listHeaders = {
      firstGradient: '#12131Aff',
      secondGradient: '#12131A80',
      thirdGradient: '#12131Aff',
    };

    networkColors = {
      arbitrum: '#ADBFE3',
      goerli: '#f6c343',
      mainnet: '#E0E8FF',
      optimism: '#FF6A6A',
      polygon: '#A275EE',
      bsc: '#F0B90B',
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

/**
 * @deprecated used for safely retrieving color values in JS not needed with TypeScript anymore
 */
const getColorForString = (colorString = '', providedThemeColors = colors) => {
  //FIXME: sometimes receive non string value
  if (!colorString || typeof colorString !== 'string') return null;

  const isValidColorString = isHex(colorString) || isRGB(colorString);
  return isValidColorString
    ? colorString
    : // @ts-expect-error Used in JS code to safely retrieve a color
      providedThemeColors?.[colorString] ?? null;
};

export const darkModeThemeColors = getColorsByTheme(true);
export const lightModeThemeColors = getColorsByTheme(false);
const colors = currentColors.themedColors ?? lightModeThemeColors;
export const getRandomColor = () =>
  Math.floor(Math.random() * colors.avatarColor.length);

currentColors.themedColors = lightModeThemeColors;

export default {
  ...colors,
  darkModeColors,
  darkModeThemeColors,
  /**
   * @deprecated used for safely retrieving color values in JS not needed with TypeScript anymore
   */
  get: getColorForString,
  getRandomColor,
  lightModeThemeColors,
  propType: PropTypes.oneOf([...Object.keys(colors), ...Object.values(colors)]),
};
