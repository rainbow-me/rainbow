import PropTypes from 'prop-types';
import React from 'react';
import VersionNumber from 'react-native-version-number';
import { colors } from '../styles';
import { Monospace } from './text';

const AppVersionStamp = ({ color, ...props }) => (
  <Monospace
    align="center"
    color={color || colors.placeholder}
    size="smedium"
    weight="medium"
    {...props}
  >
    {`${VersionNumber.appVersion} (${VersionNumber.buildVersion})`}
  </Monospace>
);

AppVersionStamp.propTypes = {
  color: PropTypes.string,
};

export default AppVersionStamp;
