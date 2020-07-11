import PropTypes from 'prop-types';
import React from 'react';
import VersionNumber from 'react-native-version-number';
import { Text } from './text';
import { colors } from '@rainbow-me/styles';

const AppVersionStamp = ({ color, ...props }) => (
  <Text
    align="center"
    color={color || colors.alpha(colors.blueGreyDark, 0.2)}
    lineHeight="normal"
    size="small"
    weight="bold"
    {...props}
  >
    {`${VersionNumber.appVersion} (${VersionNumber.buildVersion})`}
  </Text>
);

AppVersionStamp.propTypes = {
  color: PropTypes.string,
};

export default AppVersionStamp;
