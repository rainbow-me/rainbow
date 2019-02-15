import { pick } from 'lodash';
import { Dimensions } from 'react-native';

const deviceUtils = {};

deviceUtils.iPhoneXWidth = 375;
deviceUtils.iPhone6Height = 667;

deviceUtils.isNarrowPhone = Dimensions.get('window').width < deviceUtils.iPhoneXWidth;
deviceUtils.isSmallPhone = Dimensions.get('window').height <= deviceUtils.iPhone6Height;
deviceUtils.isLargePhone = Dimensions.get('window').width >= deviceUtils.iPhoneXWidth;

deviceUtils.dimensions = pick(Dimensions.get('window'), ['height', 'width']);

export default deviceUtils;
