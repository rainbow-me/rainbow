import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes } from 'recompact';
import image from '../assets/rainbow-og.png';
import QRCode from './qr-code/QRCode';

const QRCodeDisplay = ({ size, value, ...props }) => (
  <QRCode
    {...props}
    ecl="M"
    logo={image}
    logoBackgroundColor="transparent"
    logoMargin={-5}
    logoSize={84}
    size={size}
    quietZone={100}
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
