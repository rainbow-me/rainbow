import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { isSamsungGalaxy } from '../../helpers/samsung';
import { saveBackupPassword } from '../../model/backup';
import { cloudPlatform } from '../../utils/platform';
import { DelayedAlert } from '../alerts';
import { PasswordField } from '../fields';
import { Centered, Column } from '../layout';
import { GradientText, Text } from '../text';
import BackupSheetKeyboardLayout from './BackupSheetKeyboardLayout';
import { analytics } from '@/analytics';
import { cloudBackupPasswordMinLength, isCloudBackupPasswordValid } from '@/handlers/cloudBackup';
import { useBooleanState, useDimensions, useRouteExistsInNavigationState, useWalletCloudBackup, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { margin, padding } from '@/styles';
import logger from '@/utils/logger';

const DescriptionText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'large',
}))({
  ...padding.object(0, 50),
});

const Masthead = styled(Centered).attrs({
  direction: 'column',
})({
  ...padding.object(24, 0, 42),
  flexShrink: 0,
});

const MastheadIcon = styled(GradientText).attrs({
  align: 'center',
  angle: false,
  colors: ['#FFB114', '#FF54BB', '#00F0FF'],
  end: { x: 0, y: 0 },
  letterSpacing: 'roundedTight',
  size: 52,
  start: { x: 1, y: 1 },
  steps: [0, 0.5, 1],
  weight: 'bold',
})({});

const Title = styled(Text).attrs({
  size: 'big',
  weight: 'bold',
})({
  ...margin.object(15, 0, 12),
});

const samsungGalaxy = (android && isSamsungGalaxy()) || false;

export default function BackupConfirmPasswordStep() {
  const { isTinyPhone } = useDimensions();
  const { params } = useRoute();
  const { goBack } = useNavigation();
  const walletCloudBackup = useWalletCloudBackup();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [validPassword, setValidPassword] = useState(false);
  const [passwordFocused, setPasswordFocused, setPasswordBlurred] = useBooleanState(true);
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState(`􀎽 ${lang.t('back_up.confirm_password.confirm_backup')}`);
  const passwordRef = useRef();
  const keyboardShowListener = useRef(null);
  const keyboardHideListener = useRef(null);
  const { selectedWallet } = useWallets();
  const walletId = params?.walletId || selectedWallet.id;

  const isSettingsRoute = useRouteExistsInNavigationState(Routes.SETTINGS_SHEET);

  useEffect(() => {
    const keyboardDidShow = () => {
      setIsKeyboardOpen(true);
    };

    const keyboardDidHide = () => {
      setIsKeyboardOpen(false);
    };
    keyboardShowListener.current = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    keyboardHideListener.current = Keyboard.addListener('keyboardDidHide', keyboardDidHide);
    return () => {
      keyboardShowListener.current?.remove();
      keyboardHideListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    analytics.track('Confirm Password Step', {
      category: 'backup',
      label: cloudPlatform,
    });
  }, []);

  useEffect(() => {
    let passwordIsValid = false;

    if (isCloudBackupPasswordValid(password)) {
      passwordIsValid = true;
      setLabel(
        `􀑙 ${lang.t('back_up.confirm_password.add_to_cloud_platform', {
          cloudPlatformName: cloudPlatform,
        })}`
      );
    }
    setValidPassword(passwordIsValid);
  }, [password, passwordFocused]);

  const onPasswordChange = useCallback(({ nativeEvent: { text: inputText } }) => {
    setPassword(inputText);
  }, []);

  const onError = useCallback(msg => {
    passwordRef.current?.focus();
    DelayedAlert({ title: msg }, 500);
  }, []);

  const onSuccess = useCallback(async () => {
    logger.log('BackupConfirmPasswordStep:: saving backup password');
    await saveBackupPassword(password);
    if (!isSettingsRoute) {
      DelayedAlert({ title: lang.t('cloud.backup_success') }, 1000);
    }
    // This means the user didn't have the password saved
    // and at least an other wallet already backed up
    analytics.track('Backup Complete via Confirm Step', {
      category: 'backup',
      label: cloudPlatform,
    });
    goBack();
  }, [goBack, isSettingsRoute, password]);

  const onSubmit = useCallback(async () => {
    if (!validPassword) return;
    analytics.track('Tapped "Restore from cloud"');
    await walletCloudBackup({
      onError,
      onSuccess,
      password,
      walletId,
    });
  }, [onError, onSuccess, password, validPassword, walletCloudBackup, walletId]);

  return (
    <BackupSheetKeyboardLayout footerButtonDisabled={!validPassword} footerButtonLabel={label} onSubmit={onSubmit}>
      <Masthead>
        {(isTinyPhone || samsungGalaxy) && isKeyboardOpen ? null : <MastheadIcon>􀙶</MastheadIcon>}
        <Title>{lang.t('back_up.confirm_password.enter_backup_password')}</Title>
        <DescriptionText>
          {lang.t('back_up.confirm_password.enter_backup_description', {
            cloudPlatformName: cloudPlatform,
          })}
        </DescriptionText>
      </Masthead>
      <Column align="center" flex={1}>
        <PasswordField
          autoFocus
          isInvalid={password !== '' && password.length < cloudBackupPasswordMinLength && !passwordRef?.current?.isFocused?.()}
          onBlur={setPasswordBlurred}
          onChange={onPasswordChange}
          onFocus={setPasswordFocused}
          onSubmitEditing={onSubmit}
          password={password}
          placeholder={lang.t('back_up.confirm_password.backup_password_placeholder')}
          ref={passwordRef}
        />
      </Column>
    </BackupSheetKeyboardLayout>
  );
}
