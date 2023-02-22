import * as DeviceInfo from 'react-native-device-info';

export function isSamsung() {
  try {
    const deviceName = DeviceInfo.getDeviceNameSync().toLowerCase();
    if (deviceName.indexOf('samsung') !== -1) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

export function isGalaxy() {
  try {
    const deviceName = DeviceInfo.getDeviceNameSync().toLowerCase();
    if (deviceName.indexOf('galaxy') !== -1) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

export function isSamsungGalaxy() {
  return isSamsung() || isGalaxy();
}
