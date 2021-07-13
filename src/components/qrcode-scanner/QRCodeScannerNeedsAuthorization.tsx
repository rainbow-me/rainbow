import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components';
import { darkModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';
import { margin, padding, position } from '@rainbow-me/styles';

const Button = styled(ButtonPressAnimation).attrs({
  scaleTo: 1.1,
})`
  ${padding(20)};
  margin-top: 22;
`;

const ButtonLabel = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.mintDark,
  size: 'large',
  weight: 'semibold',
}))``;

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${padding(20, 50, 60, 50)};
  ${position.cover};
  background-color: ${({ theme: { colors } }) => colors.trueBlack};
`;

const QRIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.mintDark,
  name: 'camera',
  outerOpacity: 0.5,
}))`
  ${position.size(43)};
`;

const Subtitle = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(darkModeThemeColors.blueGreyDark, 0.6),
  size: 'smedium',
  weight: 'semibold',
}))``;

const Title = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  size: 'larger',
  weight: 'bold',
}))`
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
