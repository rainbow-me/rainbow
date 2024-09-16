import { getVersion } from 'react-native-device-info';

export async function isTargetedVersionOrNewer(versionToCheck: string) {
  const currentAppVersion = getVersion();
  return isGreaterThanOrEqualToVersion(currentAppVersion, versionToCheck);
}

function isGreaterThanOrEqualToVersion(currentAppVersion: string, versionToCheck: string) {
  const currentParts = currentAppVersion.split('.');
  const checkParts = versionToCheck.split('.');
  for (var i = 0; i < Math.max(currentParts.length, checkParts.length); i++) {
    const a = ~~currentParts[i] || 0; // parse int, default to 0 if undefined
    const b = ~~checkParts[i] || 0; // parse int, default to 0 if undefined
    if (a > b) return true;
    if (a < b) return false;
  }
  return true; // versions are equal
}
