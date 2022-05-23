import lang from 'i18n-js';
import React from 'react';
import { useIsEmulator } from 'react-native-device-info';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';
import { useDimensions } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const CrossHairAspectRatio = 230 / 375;

const Container = styled(Centered)(({ size }) => ({
  ...position.sizeAsObject(size),
  marginBottom: 1,
  zIndex: 1,
}));

const Crosshair = styled(Icon).attrs({
  name: 'crosshair',
})(position.coverAsObject);

export default function QRCodeScannerCrosshair() {
  const { width: deviceWidth } = useDimensions();
  const { result: isEmulator } = useIsEmulator();

  const { colors } = useTheme();
  return (
    <Container size={deviceWidth * CrossHairAspectRatio}>
      <Crosshair color={colors.whiteLabel} />
      <Text color="whiteLabel" lineHeight="none" size="large" weight="heavy">
        {isEmulator
          ? lang.t('wallet.qr.simulator_mode')
          : lang.t('wallet.qr.find_a_code')}
      </Text>
    </Container>
  );
}
