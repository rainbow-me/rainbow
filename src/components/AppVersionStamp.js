import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
// eslint-disable-next-line import/default
import CodePush from 'react-native-code-push';
import VersionNumber from 'react-native-version-number';
import { Text } from './text';
import { colors } from '@rainbow-me/styles';

async function getAppVersion() {
  const [{ appVersion }, update] = await Promise.all([
    CodePush.getConfiguration(),
    CodePush.getUpdateMetadata(),
  ]);

  if (!update) {
    return `${appVersion} (${VersionNumber.buildVersion})`;
  }

  const label = update.label.substring(1);
  return `${appVersion} (${VersionNumber.buildVersion}) rev.${label}`;
}

const AppVersionStamp = ({ color, ...props }) => {
  const [appVersion, setAppVersion] = useState(
    `${VersionNumber.appVersion} (${VersionNumber.buildVersion})`
  );

  // Try to get the codepush version number
  useEffect(() => {
    const init = async () => {
      try {
        const v = await getAppVersion();
        setAppVersion(v);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    };
    init();
  }, []);

  return (
    <Text
      align="center"
      color={color || colors.alpha(colors.blueGreyDark, 0.2)}
      lineHeight="normal"
      size="small"
      weight="bold"
      {...props}
    >
      {`${appVersion}`}
    </Text>
  );
};

AppVersionStamp.propTypes = {
  color: PropTypes.string,
};

export default AppVersionStamp;
