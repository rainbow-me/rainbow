import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, InteractionManager } from 'react-native';
import styled from 'styled-components';
import {
  fetchBackupPassword,
  restoreCloudBackup,
  saveBackupPassword,
} from '../../model/backup';
import { PasswordField } from '../fields';
import { Centered, Column } from '../layout';
import { LoadingOverlay } from '../modal';
import { GradientText, Text } from '../text';
import BackupSheetKeyboardLayout from './BackupSheetKeyboardLayout';
import {
  cloudBackupPasswordMinLength,
  isCloudBackupPasswordValid,
} from '@rainbow-me/handlers/cloudBackup';
import { removeWalletData } from '@rainbow-me/handlers/localstorage/removeWallet';
import WalletLoadingStates from '@rainbow-me/helpers/walletLoadingStates';
import { useAccountSettings, useWallets } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { sheetVerticalOffset } from '@rainbow-me/navigation/effects';
import Routes from '@rainbow-me/routes';
import { colors, margin, padding } from '@rainbow-me/styles';
import { usePortal } from 'react-native-cool-modals/Portal';

const DescriptionText = styled(Text).attrs({
  align: 'center',
  color: colors.blueGreyDark50,
  lineHeight: 'looser',
  size: 'large',
})``;

const Masthead = styled(Centered).attrs({
  direction: 'column',
})`
  ${padding(24, 50, 39)};
  flex-shrink: 0;
`;

const MastheadIcon = styled(GradientText).attrs({
  align: 'center',
  angle: false,
  colors: ['#FFB114', '#FF54BB', '#00F0FF'],
  end: { x: 0, y: 0 },
  size: 52,
  start: { x: 1, y: 1 },
  steps: [0, 0.5, 1],
  weight: 'bold',
})``;

const Title = styled(Text).attrs({
  size: 'big',
  weight: 'bold',
})`
  ${margin(15, 0, 12)};
`;

export default function RestoreIcloudStep({ userData }) {
  const { goBack, replace } = useNavigation();
  const { isWalletLoading, setIsWalletLoading } = useWallets();
  const { accountAddress } = useAccountSettings();
  const [validPassword, setValidPassword] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('􀎽 Confirm Backup');
  const passwordRef = useRef();

  const { setComponent, hide } = usePortal();
  useEffect(() => {
    if (isWalletLoading) {
      setComponent(
        <LoadingOverlay
          paddingTop={sheetVerticalOffset}
          title={isWalletLoading}
        />,
        false
      );
    }
    return hide;
  }, [hide, isWalletLoading, setComponent]);

  useEffect(() => {
    const fetchPasswordIfPossible = async () => {
      const pwd = await fetchBackupPassword();
      if (pwd) {
        setPassword(pwd);
      }
    };
    fetchPasswordIfPossible();
  }, []);

  useEffect(() => {
    let newLabel = '';
    let passwordIsValid = false;

    if (incorrectPassword) {
      newLabel = 'Incorrect Password';
    } else {
      if (isCloudBackupPasswordValid(password)) {
        passwordIsValid = true;
      }

      newLabel = `􀑙 Restore from iCloud`;
    }

    setValidPassword(passwordIsValid);
    setLabel(newLabel);
  }, [incorrectPassword, password]);

  const onPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }) => {
      setPassword(inputText);
      setIncorrectPassword(false);
    },
    []
  );

  const onSubmit = useCallback(async () => {
    try {
      setIsWalletLoading(WalletLoadingStates.RESTORING_WALLET);
      const success = await restoreCloudBackup(password, userData);
      if (success) {
        // Store it in the keychain in case it was missing
        await saveBackupPassword(password);
        // Get rid of the current wallet
        await removeWalletData(accountAddress);
        goBack();
        InteractionManager.runAfterInteractions(async () => {
          replace(Routes.SWIPE_LAYOUT);
          setIsWalletLoading(null);
        });
      } else {
        setIncorrectPassword(true);
        setIsWalletLoading(null);
      }
    } catch (e) {
      setIsWalletLoading(null);
      Alert.alert('Error while restoring backup');
    }
  }, [accountAddress, goBack, password, replace, setIsWalletLoading, userData]);

  const onPasswordSubmit = useCallback(() => {
    validPassword && onSubmit();
  }, [onSubmit, validPassword]);

  return (
    <BackupSheetKeyboardLayout
      footerButtonDisabled={!validPassword}
      footerButtonLabel={label}
      onSubmit={onSubmit}
    >
      <Masthead>
        <MastheadIcon>􀙶</MastheadIcon>
        <Title>Enter backup password</Title>
        <DescriptionText>
          To restore your wallet, enter the backup password you created
        </DescriptionText>
      </Masthead>
      <Column align="center" flex={1}>
        <PasswordField
          autoFocus
          isInvalid={
            (password !== '' &&
              password.length < cloudBackupPasswordMinLength &&
              !passwordRef?.current?.isFocused?.()) ||
            incorrectPassword
          }
          onChange={onPasswordChange}
          onSubmitEditing={onPasswordSubmit}
          password={password}
          placeholder="Backup Password"
          ref={passwordRef}
          returnKeyType="next"
        />
      </Column>
    </BackupSheetKeyboardLayout>
  );
}
