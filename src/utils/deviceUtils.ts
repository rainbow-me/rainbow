import { Dimensions, Platform } from 'react-native';

import { IS_IOS } from '@/env';

const { height, width } = Dimensions.get('window');

const deviceUtils = (function () {
  const iPhone6Height = 667,
    iphoneSEHeight = 568,
    iPhoneXHeight = 812,
    iPhoneXWidth = 375,
    veryNarrowPhoneThreshold = 340;

  return {
    dimensions: {
      height,
      width,
    },
    iPhone6Height,
    iphoneSEHeight,
    iPhoneXHeight,
    iPhoneXWidth,
    isIOS14: IS_IOS && parseFloat(Platform.Version as string) >= 14,
    isLargePhone: width >= iPhoneXWidth,
    isNarrowPhone: width < iPhoneXWidth,
    isSmallPhone: height <= iPhone6Height,
    isTallPhone: height >= iPhoneXHeight,
    isTinyPhone: height <= iphoneSEHeight,
    isVeryNarrowPhone: width < veryNarrowPhoneThreshold,
  };
})();

export default deviceUtils;
