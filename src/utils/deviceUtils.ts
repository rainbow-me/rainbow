import { Dimensions, Platform } from 'react-native';

const { height, width } = Dimensions.get('window');

const deviceUtils = {};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'iPhoneXHeight' does not exist on type '{... Remove this comment to see the full error message
deviceUtils.iPhoneXHeight = 812;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'iPhoneXWidth' does not exist on type '{}... Remove this comment to see the full error message
deviceUtils.iPhoneXWidth = 375;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'iPhone6Height' does not exist on type '{... Remove this comment to see the full error message
deviceUtils.iPhone6Height = 667;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'iphoneSEHeight' does not exist on type '... Remove this comment to see the full error message
deviceUtils.iphoneSEHeight = 568;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'isNarrowPhone' does not exist on type '{... Remove this comment to see the full error message
deviceUtils.isNarrowPhone = width < deviceUtils.iPhoneXWidth;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'isSmallPhone' does not exist on type '{}... Remove this comment to see the full error message
deviceUtils.isSmallPhone = height <= deviceUtils.iPhone6Height;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'isLargePhone' does not exist on type '{}... Remove this comment to see the full error message
deviceUtils.isLargePhone = width >= deviceUtils.iPhoneXWidth;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'isTallPhone' does not exist on type '{}'... Remove this comment to see the full error message
deviceUtils.isTallPhone = height >= deviceUtils.iPhoneXHeight;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'isTinyPhone' does not exist on type '{}'... Remove this comment to see the full error message
deviceUtils.isTinyPhone = height <= deviceUtils.iphoneSEHeight;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
deviceUtils.dimensions = {
  height,
  width,
};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'isIOS14' does not exist on type '{}'.
deviceUtils.isIOS14 = ios && parseFloat(Platform.Version) >= 14;

export default deviceUtils;
