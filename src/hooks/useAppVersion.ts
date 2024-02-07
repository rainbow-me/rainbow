import codePush, { LocalPackage } from 'react-native-code-push';
import VersionNumber from 'react-native-version-number';

function formatAppVersion(appVersion = VersionNumber.appVersion, update: LocalPackage) {
  let version = `${appVersion} (${VersionNumber.buildVersion})`;
  if (update) {
    version = version + ` rev.${update.label.substring(1)}`;
  }
  return version;
}
// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 0.
const defaultAppVersion = formatAppVersion();

let codepushLabel = 'None';

codePush.getUpdateMetadata().then(update => {
  if (update) {
    codepushLabel = update.label;
  }
});

export default function useAppVersion() {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [version] = useState(defaultAppVersion);
  return [version, codepushLabel];
}
