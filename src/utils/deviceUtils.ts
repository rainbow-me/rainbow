import { Dimensions, PixelRatio, Platform, NativeModules } from 'react-native';
import { getRealWindowHeight } from 'react-native-extra-dimensions-android';
import SafeAreaView from 'react-native-safe-area-view';
import { IS_ANDROID, IS_IOS } from '@/env';

const scale = Dimensions.get('screen').scale;
const { height, width } = Dimensions.get('window');

export const NAVIGATION_BAR_HEIGHT = IS_ANDROID ? NativeModules.NavbarHeight.getNavigationBarHeight() / scale : 0;
const PLATFORM_ADJUSTED_HEIGHT = IS_IOS ? height : getRealWindowHeight() - (isUsingButtonNavigation() ? getAndroidBottomInset() : 0);

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
      height: PLATFORM_ADJUSTED_HEIGHT,
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

export function isUsingButtonNavigation() {
  if (!IS_ANDROID) return false;
  return NAVIGATION_BAR_HEIGHT > 40;
}

export function getAndroidBottomInset() {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'getInset' does not exist on type 'Compon... Remove this comment to see the full error message
  return isUsingButtonNavigation() ? (SafeAreaView.getInset('bottom') ?? 0) + NAVIGATION_BAR_HEIGHT : SafeAreaView.getInset('bottom') ?? 0;
}

export const ANDROID_BOTTOM_INSET = getAndroidBottomInset();
export const DEVICE_WIDTH = deviceUtils.dimensions.width;
export const DEVICE_HEIGHT = deviceUtils.dimensions.height;
export const PIXEL_RATIO = PixelRatio.get();
export default deviceUtils;
