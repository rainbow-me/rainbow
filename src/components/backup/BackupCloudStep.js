import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import styled from 'styled-components';
import zxcvbn from 'zxcvbn';
import { isSamsungGalaxy } from '../../helpers/samsung';
import { saveBackupPassword } from '../../model/backup';
import { cloudPlatform } from '../../utils/platform';
import { DelayedAlert } from '../alerts';
import { PasswordField } from '../fields';
import { Centered, ColumnWithMargins } from '../layout';
import { GradientText, Text } from '../text';
import BackupSheetKeyboardLayout from './BackupSheetKeyboardLayout';
import {
  cloudBackupPasswordMinLength,
  isCloudBackupPasswordValid,
} from '@rainbow-me/handlers/cloudBackup';
import {
  useDimensions,
  useMagicAutofocus,
  useRouteExistsInNavigationState,
  useWalletCloudBackup,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors, padding } from '@rainbow-me/styles';
import logger from 'logger';

const DescriptionText = styled(Text).attrs(({ isTinyPhone }) => ({
  align: 'center',
  color: colors.blueGreyDark50,
  lineHeight: 'looser',
  size: isTinyPhone ? 'lmedium' : 'large',
}))``;

const ImportantText = styled(DescriptionText).attrs({
  color: colors.blueGreyDark60,
  weight: 'medium',
})``;

const Masthead = styled(Centered).attrs({
  direction: 'column',
})`
  ${({ isTallPhone, isTinyPhone }) =>
    padding(isTinyPhone ? 0 : 9, isTinyPhone ? 10 : 50, isTallPhone ? 39 : 19)};
  flex-shrink: 0;
`;

const MastheadIcon = styled(GradientText).attrs({
  align: 'center',
  angle: false,
  colors: colors.gradients.rainbow,
  end: { x: 0, y: 0.5 },
  size: 43,
  start: { x: 1, y: 0.5 },
  steps: [0, 0.774321, 1],
  weight: 'medium',
})``;

const Title = styled(Text).attrs(({ isTinyPhone }) => ({
  size: isTinyPhone ? 'large' : 'big',
  weight: 'bold',
}))`
  ${({ isTinyPhone }) => (isTinyPhone ? padding(0) : padding(15, 0, 12))};
`;

const samsungGalaxy = (android && isSamsungGalaxy()) || false;

export default function BackupCloudStep() {
  const { isTallPhone, isTinyPhone } = useDimensions();
  const currentlyFocusedInput = useRef();
  const { params } = useRoute();
  const walletCloudBackup = useWalletCloudBackup();
  const { selectedWallet, setIsWalletLoading } = useWallets();
  const [validPassword, setValidPassword] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const keyboardDidShow = () => {
      setIsKeyboardOpen(true);
    };

    const keyboardDidHide = () => {
      setIsKeyboardOpen(false);
    };
    Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    Keyboard.addListener('keyboardDidHide', keyboardDidHide);
    return () => {
      Keyboard.removeListener('keyboardDidShow', keyboardDidShow);
      Keyboard.removeListener('keyboardDidHide', keyboardDidHide);
    };
  }, []);

  const isSettingsRoute = useRouteExistsInNavigationState(
    Routes.SETTINGS_MODAL
  );

  const walletId = params?.walletId || selectedWallet.id;
  const { goBack } = useNavigation();

  const [label, setLabel] = useState(
    !validPassword ? `􀙶 Add to ${cloudPlatform} Backup` : '􀎽 Confirm Backup'
  );
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();

  useEffect(() => {
    setTimeout(() => {
      passwordRef.current?.focus();
    }, 1);
    analytics.track('Choose Password Step', {
      category: 'backup',
      label: cloudPlatform,
    });
  }, []);

  const { handleFocus } = useMagicAutofocus(passwordRef);

  const onPasswordFocus = useCallback(
    target => {
      handleFocus(target);
      setPasswordFocused(true);
      currentlyFocusedInput.current = passwordRef.current;
    },
    [handleFocus]
  );

  const onConfirmPasswordFocus = useCallback(
    target => {
      handleFocus(target);
      currentlyFocusedInput.current = confirmPasswordRef.current;
    },
    [handleFocus]
  );

  const onPasswordBlur = useCallback(() => {
    setPasswordFocused(false);
  }, []);

  const onPasswordSubmit = useCallback(() => {
    confirmPasswordRef.current?.focus();
  }, []);

  useEffect(() => {
    let passwordIsValid = false;
    if (password === confirmPassword && isCloudBackupPasswordValid(password)) {
      passwordIsValid = true;
    }

    let newLabel = '';
    if (passwordIsValid) {
      newLabel = '􀎽 Confirm Backup';
    } else if (password.length < cloudBackupPasswordMinLength) {
      newLabel = `Minimum ${cloudBackupPasswordMinLength} characters`;
    } else if (
      password !== '' &&
      password.length < cloudBackupPasswordMinLength &&
      !passwordRef.current?.isFocused()
    ) {
      newLabel = 'Use a longer password';
    } else if (
      isCloudBackupPasswordValid(password) &&
      isCloudBackupPasswordValid(confirmPassword) &&
      confirmPassword.length >= password.length &&
      password !== confirmPassword
    ) {
      newLabel = `Passwords don't match`;
    } else if (
      password.length >= cloudBackupPasswordMinLength &&
      !passwordFocused
    ) {
      newLabel = 'Confirm password';
    } else if (
      password.length >= cloudBackupPasswordMinLength &&
      passwordFocused
    ) {
      const passInfo = zxcvbn(password);
      switch (passInfo.score) {
        case 0:
        case 1:
          newLabel = '💩 Weak password';
          break;
        case 2:
          newLabel = '👌 Good password';
          break;
        case 3:
          newLabel = '💪 Great password';
          break;
        case 4:
          newLabel = '🏰️ Strong password';
          break;
        default:
      }
    }

    setValidPassword(passwordIsValid);
    setLabel(newLabel);
  }, [confirmPassword, password, passwordFocused]);

  const onPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }) => {
      setPassword(inputText);
    },
    []
  );

  const onConfirmPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }) => {
      setConfirmPassword(inputText);
    },
    []
  );

  const onError = useCallback(
    msg => {
      setTimeout(onPasswordSubmit, 1000);
      setIsWalletLoading(null);
      DelayedAlert({ title: msg }, 500);
    },
    [onPasswordSubmit, setIsWalletLoading]
  );

  const onSuccess = useCallback(async () => {
    logger.log('BackupCloudStep:: saving backup password');
    await saveBackupPassword(password);
    if (!isSettingsRoute) {
      DelayedAlert({ title: lang.t('cloud.backup_success') }, 1000);
    }
    // This means the user set a new password
    // and it was the first wallet backed up
    analytics.track('Backup Complete', {
      category: 'backup',
      label: cloudPlatform,
    });
    goBack();
  }, [goBack, isSettingsRoute, password]);

  const onConfirmBackup = useCallback(async () => {
    await walletCloudBackup({
      onError,
      onSuccess,
      password,
      walletId,
    });
  }, [onError, onSuccess, password, walletCloudBackup, walletId]);

  const onConfirmPasswordSubmit = useCallback(() => {
    validPassword && onConfirmBackup();
  }, [onConfirmBackup, validPassword]);

  return (
    <BackupSheetKeyboardLayout
      footerButtonDisabled={!validPassword}
      footerButtonLabel={label}
      onSubmit={onConfirmBackup}
    >
      <Masthead isTallPhone={isTallPhone} isTinyPhone={isTinyPhone}>
        {(isTinyPhone || samsungGalaxy) && isKeyboardOpen ? null : (
          <MastheadIcon>􀌍</MastheadIcon>
        )}
        <Title isTinyPhone={isTinyPhone}>Choose a password</Title>
        <DescriptionText isTinyPhone={isTinyPhone}>
          Please use a password you&apos;ll remember.&nbsp;
          <ImportantText isTinyPhone={isTinyPhone}>
            It can&apos;t be recovered!
          </ImportantText>
        </DescriptionText>
      </Masthead>
      <ColumnWithMargins align="center" flex={1} margin={android ? 0 : 19}>
        <PasswordField
          isInvalid={
            password !== '' &&
            password.length < cloudBackupPasswordMinLength &&
            !passwordRef.current.isFocused()
          }
          isValid={isCloudBackupPasswordValid(password)}
          onBlur={onPasswordBlur}
          onChange={onPasswordChange}
          onFocus={onPasswordFocus}
          onSubmitEditing={onPasswordSubmit}
          password={password}
          placeholder="Backup Password"
          ref={passwordRef}
          returnKeyType="next"
          textContentType="newPassword"
        />
        <PasswordField
          editable={isCloudBackupPasswordValid(password)}
          isInvalid={
            isCloudBackupPasswordValid(confirmPassword) &&
            confirmPassword.length >= password.length &&
            confirmPassword !== password
          }
          isValid={validPassword}
          onChange={onConfirmPasswordChange}
          onFocus={onConfirmPasswordFocus}
          onSubmitEditing={onConfirmPasswordSubmit}
          password={confirmPassword}
          placeholder="Confirm Password"
          ref={confirmPasswordRef}
        />
      </ColumnWithMargins>
    </BackupSheetKeyboardLayout>
  );
}
