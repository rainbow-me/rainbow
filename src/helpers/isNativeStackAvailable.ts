import { Platform } from 'react-native';

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
export default ios && parseFloat(Platform.Version) >= 13;
