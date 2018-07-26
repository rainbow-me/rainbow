import { Dimensions } from 'react-native';

const deviceUtils = {};

console.log('Dimensions', Dimensions.get('window'));

deviceUtils.iPhoneXWidth = 375;
deviceUtils.isSmallPhone = Dimensions.get('window').width < deviceUtils.iPhoneXWidth;
deviceUtils.isLargePhone = Dimensions.get('window').width >= deviceUtils.iPhoneXWidth;

deviceUtils.height = Dimensions.get('window').height;
deviceUtils.width = Dimensions.get('window').width;

export default deviceUtils;
