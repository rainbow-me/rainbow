import VersionNumber from 'react-native-version-number';
import { useState } from 'react';
function formatAppVersion(appVersion = VersionNumber.appVersion) {
  let version = `${appVersion} (${VersionNumber.buildVersion})`;
  return version;
}

const defaultAppVersion = formatAppVersion();

export default function useAppVersion(): string {
  const [version] = useState(defaultAppVersion);
  return version;
}
