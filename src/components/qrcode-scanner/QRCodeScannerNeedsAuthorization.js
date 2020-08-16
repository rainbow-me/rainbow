import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';
import { colors, margin, padding, position } from '@rainbow-me/styles';

const Button = styled(ButtonPressAnimation).attrs({
  scaleTo: 1.1,
})`
  ${padding(20)};
  margin-top: 22;
`;

const ButtonLabel = styled(Text).attrs({
  align: 'center',
  color: colors.mintDark,
  size: 'large',
  weight: 'semibold',
})``;

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${padding(30, 50, 60, 30)};
  ${position.cover};
  background-color: ${colors.black};
`;

const QRIcon = styled(Icon).attrs({
  color: colors.mintDark,
  name: 'camera',
  outerOpacity: 0.5,
})`
  ${position.size(43)};
`;

const Subtitle = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.darkModeColors.blueGreyDark, 0.6),
  size: 'smedium',
  weight: 'semibold',
})``;

const Title = styled(Text).attrs({
  align: 'center',
  color: colors.white,
  size: 'larger',
  weight: 'bold',
})`
  ${margin(20.5, 0, 8)};
`;

export default function QRCodeScannerNeedsAuthorization() {
  const handlePressSettings = useCallback(() => {
    Linking.canOpenURL('app-settings:').then(() =>
      Linking.openURL('app-settings:')
    );
  }, []);

  return (
    <Container>
      <QRIcon />
      <Title>Scan to pay or connect</Title>
      <Subtitle>Camera access needed to scan!</Subtitle>
      <Button onPress={handlePressSettings}>
        <ButtonLabel>Enable camera access 􀄫</ButtonLabel>
      </Button>
    </Container>
  );
}
