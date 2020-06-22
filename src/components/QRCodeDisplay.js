import PropTypes from 'prop-types';
import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { onlyUpdateForPropTypes } from 'recompact';
import image from '../assets/icon-pixel.png';

const QRCodeDisplay = ({ size, value, ...props }) => (
  <QRCode
    {...props}
    size={size}
    value={value}
    logo={image}
    logoSize={84}
    logoMargin={-5}
    logoBackgroundColor="transparent"
    quietZone={100}
    ecl="Q"
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
