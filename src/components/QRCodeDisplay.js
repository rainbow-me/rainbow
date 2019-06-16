import PropTypes from 'prop-types';
import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { withNeverRerender } from '../hoc';

const QRCodeDisplay = ({ size, value, ...props }) => (
  <QRCode
    {...props}
    size={size}
    value={value}
  />
);

QRCodeDisplay.propTypes = {
  size: PropTypes.number,
  value: PropTypes.string.isRequired,
};

QRCodeDisplay.defaultProps = {
  size: 150,
};

export default withNeverRerender(QRCodeDisplay);
