import PropTypes from 'prop-types';
import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import styled from 'styled-components/primitives';
import { Centered } from '../components/layout';
import { colors, padding, position, shadow } from '../styles';

const QRCodeContainer = styled(Centered)`
  ${({ gutter }) => padding(gutter)}
  ${({ gutter, size }) => position.size(size + (gutter * 2))}
  ${shadow.build(0, 3, 5)}
  ${shadow.build(0, 6, 10)}
  background-color: ${colors.white};
  border-color: ${shadow.color};
  border-radius: ${({ gutter }) => (gutter - 1)};
  border-width: 1;
`;

const QRCodeDisplay = ({ size, value }) => (
  <QRCodeContainer gutter={size / 6} size={size}>
    {value && <QRCode size={size} value={value} />}
  </QRCodeContainer>
);

QRCodeDisplay.propTypes = {
  size: PropTypes.number,
  value: PropTypes.string,
};

QRCodeDisplay.defaultProps = {
  size: 150,
};

export default QRCodeDisplay;
