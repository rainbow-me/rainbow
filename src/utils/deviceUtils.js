import { Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

const deviceUtils = {};

deviceUtils.iPhoneXWidth = 375;
deviceUtils.iPhone6Height = 667;

deviceUtils.isNarrowPhone = width < deviceUtils.iPhoneXWidth;
deviceUtils.isSmallPhone = height <= deviceUtils.iPhone6Height;
deviceUtils.isLargePhone = width >= deviceUtils.iPhoneXWidth;

deviceUtils.dimensions = {
  height,
  width,
};

export default deviceUtils;
