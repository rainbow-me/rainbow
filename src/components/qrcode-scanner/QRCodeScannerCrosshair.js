import PropTypes from 'prop-types';
import React from 'react';
import { useDimensions } from '../../hooks';
import { position } from '../../styles';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';

const QRCodeScannerCrosshair = ({ showText, text }) => {
  const { width: deviceWidth } = useDimensions();
  return (
    <Centered
      {...position.sizeAsObject(deviceWidth * (259 / 375))}
      marginBottom={1}
      zIndex={1}
    >
      <Icon css={position.cover} name="crosshair" />
      {showText ? (
        <Text color="white" lineHeight="none" size="large" weight="bold">
          {text}
        </Text>
      ) : null}
    </Centered>
  );
};

QRCodeScannerCrosshair.propTypes = {
  showText: PropTypes.bool,
  text: PropTypes.string,
};

QRCodeScannerCrosshair.defaultProps = {
  text: 'Find a code to scan',
};

export default React.memo(QRCodeScannerCrosshair);
