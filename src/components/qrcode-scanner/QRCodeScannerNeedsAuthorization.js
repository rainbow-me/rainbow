import lang from 'i18n-js';
import pWaitFor from 'p-wait-for';
import React, { useCallback } from 'react';
import { AppState, Linking } from 'react-native';
import { darkModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';
import { delay } from '@rainbow-me/helpers/utilities';
import styled from '@rainbow-me/styled-components';
import { margin, padding, position } from '@rainbow-me/styles';

const Button = styled(ButtonPressAnimation).attrs({
  scaleTo: 1.1,
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

const Container = styled(Centered).attrs({
  direction: 'column',
})({
  ...padding.object(20, 50, 60, 50),
  ...position.coverAsObject,
  backgroundColor: ({ theme: { colors } }) => colors.trueBlack,
});

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
    <Container>
      <QRIcon />
      <Title>{lang.t('wallet.qr.scan_to_pay_or_connect')}</Title>
      <Subtitle>{lang.t('wallet.qr.camera_access_needed')}</Subtitle>
      <Button onPress={handlePressSettings}>
        <ButtonLabel>{lang.t('wallet.qr.enable_camera_access')} 􀄫</ButtonLabel>
      </Button>
    </Container>
  );
}
