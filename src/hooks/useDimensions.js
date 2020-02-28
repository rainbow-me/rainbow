import { useWindowDimensions } from 'react-native';

const deviceDimensions = {
  iphone6: {
    height: 667,
    width: 375,
  },
  iphoneX: {
    height: 812,
    width: 375,
  },
};

export default function useDimensions() {
  const { height, width } = useWindowDimensions();
  return {
    height,
    isLargePhone: width >= deviceDimensions.iphoneX.width,
    isNarrowPhone: width < deviceDimensions.iphoneX.width,
    isSmallPhone: height <= deviceDimensions.iphone6.height,
    isTallPhone: height >= deviceDimensions.iphoneX.height,
    width,
  };
}
