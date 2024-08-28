import { Dimensions, PixelRatio, Platform, NativeModules } from 'react-native';
const { NavbarHeight } = NativeModules;

import { IS_ANDROID, IS_IOS } from '@/env';

const { height, width } = Dimensions.get('window');
const scale = Dimensions.get('screen').scale;

const deviceUtils = (function () {
  const iPhone15ProHeight = 852,
    iPhone6Height = 667,
    iphoneSEHeight = 568,
    iPhoneXHeight = 812,
    iPhoneXWidth = 375,
    veryNarrowPhoneThreshold = 340;

  const isIOS14 = IS_IOS && parseFloat(Platform.Version as string) >= 14;
  const isAndroid12 = Platform.OS === 'android' && parseFloat(Platform.constants.Release as string) >= 12;

  return {
    dimensions: {
      height,
      width,
    },
    hasClipboardProtection: isIOS14 || isAndroid12,
    iPhone15ProHeight,
    iPhone6Height,
    iphoneSEHeight,
    iPhoneXHeight,
    iPhoneXWidth,
    isIOS14,
    isLargePhone: width >= iPhoneXWidth,
    isNarrowPhone: width < iPhoneXWidth,
    isSmallPhone: height <= iPhone6Height,
    isTallPhone: height >= iPhoneXHeight,
    isTinyPhone: height <= iphoneSEHeight,
    isVeryNarrowPhone: width < veryNarrowPhoneThreshold,
  };
})();

export const DEVICE_WIDTH = deviceUtils.dimensions.width;
export const DEVICE_HEIGHT = deviceUtils.dimensions.height;
export const PIXEL_RATIO = PixelRatio.get();
export const NAVIGATION_BAR_HEIGHT = NavbarHeight.getNavigationBarHeight() / scale;
export default deviceUtils;

export const isUsingButtonNavigation = () => {
  if (!IS_ANDROID) return false;
  return NAVIGATION_BAR_HEIGHT > 40;
};
