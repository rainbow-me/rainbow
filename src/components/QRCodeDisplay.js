import PropTypes from 'prop-types';
import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { onlyUpdateForPropTypes } from 'recompact';

const QRCodeDisplay = ({ size, value, ...props }) => (
  <QRCode
    {...props}
    size={size}
    value={value}
  />
);

QRCodeDisplay.propTypes = {
  size: PropTypes.number,
  value: PropTypes.string,
};

QRCodeDisplay.defaultProps = {
  size: 150,
};

export default onlyUpdateForPropTypes(QRCodeDisplay);
