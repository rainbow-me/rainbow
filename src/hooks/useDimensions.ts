import { ScaledSize, useWindowDimensions } from 'react-native';

const deviceDimensions = {
  iphone6: {
    height: 667,
    width: 375,
  },
  iphoneSE: {
    height: 568,
    width: 320,
  },
  iphoneX: {
    height: 812,
    width: 375,
  },
};

export interface DeviceDimensions extends ScaledSize {
  isLargePhone: boolean;
  isNarrowPhone: boolean;
  isSmallPhone: boolean;
  isTallPhone: boolean;
  isTinyPhone: boolean;
}

export default function useDimensions(): DeviceDimensions {
  const { height, width, ...restOfDimensions } = useWindowDimensions();
  return {
    height,
    isLargePhone: width >= deviceDimensions.iphoneX.width,
    isNarrowPhone: width < deviceDimensions.iphoneX.width,
    isSmallPhone: height <= deviceDimensions.iphone6.height,
    isTallPhone: height >= deviceDimensions.iphoneX.height,
    isTinyPhone: height <= deviceDimensions.iphoneSE.height,
    width,
    ...restOfDimensions,
  };
}
