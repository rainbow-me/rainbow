import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { position } from '../../styles';
import { deviceUtils } from '../../utils';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';

const Container = styled(Centered)`
  ${position.size(deviceUtils.dimensions.width * (259 / 375))};
  margin-bottom: 1;
  z-index: 1;
`;

const QRCodeScannerCrosshair = ({ showText, text }) => (
  <Container>
    <Icon
      css={position.cover}
      name="crosshair"
    />
    {showText ? (
      <Text
        color="white"
        letterSpacing="tight"
        lineHeight="none"
        size="lmedium"
        weight="medium"
      >
        {text}
      </Text>
    ) : null}
  </Container>
);

QRCodeScannerCrosshair.propTypes = {
  showText: PropTypes.bool,
  text: PropTypes.string,
};

QRCodeScannerCrosshair.defaultProps = {
  text: 'Scan to connect or send',
};

export default QRCodeScannerCrosshair;
