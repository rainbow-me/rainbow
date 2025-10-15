import i18n from '@/languages';
import pWaitFor from 'p-wait-for';
import React, { useCallback } from 'react';
import { AppState, Linking } from 'react-native';
import { darkModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Text } from '../text';
import { delay } from '@/utils/delay';
import styled from '@/styled-thing';
import { margin, padding, position } from '@/styles';
import { Box } from '@/design-system';

const Button = styled(ButtonPressAnimation).attrs({
  scaleTo: 1.08,
})({
  ...padding.object(20),
  marginTop: 22,
});

const ButtonLabel = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.mintDark,
  size: 'large',
  weight: 'semibold',
}))({});

const QRIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.mintDark,
  name: 'camera',
  outerOpacity: 0.5,
}))(position.sizeAsObject(43));

const Subtitle = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(darkModeThemeColors.blueGreyDark, 0.6),
  size: 'smedium',
  weight: 'semibold',
}))({});

const Title = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  size: 'larger',
  weight: 'bold',
}))(margin.object(20.5, 0, 8));

export default function QRCodeScannerNeedsAuthorization({ onGetBack }) {
  const handlePressSettings = useCallback(async () => {
    Linking.openSettings();

    await delay(1000);

    await pWaitFor(() => AppState.currentState === 'active');

    onGetBack?.();
  }, [onGetBack]);

  return (
    <Box alignItems="center">
      <QRIcon />
      <Title>{i18n.wallet.qr.scan_to_pay_or_connect()}</Title>
      <Subtitle>{i18n.wallet.qr.camera_access_needed()}</Subtitle>
      <Button onPress={handlePressSettings}>
        <ButtonLabel>{i18n.wallet.qr.enable_camera_access()}</ButtonLabel>
      </Button>
    </Box>
  );
}
