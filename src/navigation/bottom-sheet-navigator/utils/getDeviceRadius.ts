import DeviceInfo from 'react-native-device-info';
import { IS_ANDROID } from '@/env';

const ANDROID_RADIUS = 30;
const DEFAULT_RADIUS = 30;
const IPAD_RADIUS = 18;
const IPHONE_DEVICES: Record<string, number> = {
  'iPhone10,3': 39,
  'iPhone10,6': 39,
  'iPhone11,2': 39,
  'iPhone11,4': 39,
  'iPhone11,6': 39,
  'iPhone11,8': 41.5,
  'iPhone12,1': 41.5,
  'iPhone12,3': 39.9,
  'iPhone12,5': 39.9,
  'iPhone13,1': 44.0,
  'iPhone13,2': 47.33,
  'iPhone13,3': 47.33,
  'iPhone13,4': 53.33,
  'iPhone14,2': 47.33,
  'iPhone14,3': 53.33,
  'iPhone14,4': 44,
  'iPhone14,5': 47.33,
  'iPhone14,7': 47.33,
  'iPhone14,8': 53.33,
  'iPhone15,2': 55,
  'iPhone15,3': 55,
};

export function getDeviceRadius(): number {
  const deviceId = DeviceInfo.getDeviceId();

  if (IS_ANDROID) {
    return ANDROID_RADIUS;
  }

  if (deviceId.includes('iPad')) {
    return IPAD_RADIUS;
  }

  const radius = IPHONE_DEVICES[deviceId];

  if (!radius) {
    return DEFAULT_RADIUS;
  }

  return radius;
}
