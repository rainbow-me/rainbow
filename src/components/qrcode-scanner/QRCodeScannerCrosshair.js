import React from 'react';
import { useIsEmulator } from 'react-native-device-info';
import styled from 'styled-components';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';
import { useDimensions } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';

const CrossHairAspectRatio = 230 / 375;

const Container = styled(Centered)`
  ${({ size }) => position.size(size)};
  margin-bottom: 1;
  z-index: 1;
`;

const Crosshair = styled(Icon).attrs({
  name: 'crosshair',
})`
  ${position.cover};
`;

export default function QRCodeScannerCrosshair() {
  const { width: deviceWidth } = useDimensions();
  const { result: isEmulator } = useIsEmulator();

  const { colors } = useTheme();
  return (
    <Container size={deviceWidth * CrossHairAspectRatio}>
      <Crosshair color={colors.whiteLabel} />
      <Text color="whiteLabel" lineHeight="none" size="large" weight="heavy">
        {isEmulator ? 'Simulator Mode' : 'Find a code to scan'}
      </Text>
    </Container>
  );
}
