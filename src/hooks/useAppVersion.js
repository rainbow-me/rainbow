import VersionNumber from 'react-native-version-number';

function formatAppVersion(appVersion = VersionNumber.appVersion, update) {
  let version = `${appVersion} (${VersionNumber.buildVersion})`;
  if (update) {
    version = version + ` rev.${update.label.substring(1)}`;
  }
  return version;
}
const defaultAppVersion = formatAppVersion();

export default function useAppVersion() {
  const [version] = useState(defaultAppVersion);
  return version;
}
