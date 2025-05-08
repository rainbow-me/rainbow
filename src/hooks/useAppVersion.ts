import VersionNumber from 'react-native-version-number';

function getFormattedAppVersion(appVersion = VersionNumber.appVersion): string {
  const version = `${appVersion} (${VersionNumber.buildVersion})`;
  return version;
}

export const CURRENT_APP_VERSION = getFormattedAppVersion();

export default function useAppVersion(): string {
  return CURRENT_APP_VERSION;
}
