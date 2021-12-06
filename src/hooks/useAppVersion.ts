import VersionNumber from 'react-native-version-number';

function formatAppVersion(appVersion = VersionNumber.appVersion, update: any) {
  let version = `${appVersion} (${VersionNumber.buildVersion})`;
  if (update) {
    version = version + ` rev.${update.label.substring(1)}`;
  }
  return version;
}
// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 0.
const defaultAppVersion = formatAppVersion();

export default function useAppVersion() {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [version] = useState(defaultAppVersion);
  return version;
}
