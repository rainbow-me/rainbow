import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, InteractionManager, Keyboard } from 'react-native';
import styled from 'styled-components';
import { isSamsungGalaxy } from '../../helpers/samsung';
import {
  fetchBackupPassword,
  restoreCloudBackup,
  saveBackupPassword,
} from '../../model/backup';
import { cloudPlatform } from '../../utils/platform';
import { PasswordField } from '../fields';
import { Centered, Column } from '../layout';
import { GradientText, Text } from '../text';
import BackupSheetKeyboardLayout from './BackupSheetKeyboardLayout';
import {
  cloudBackupPasswordMinLength,
  isCloudBackupPasswordValid,
} from '@rainbow-me/handlers/cloudBackup';
import { removeWalletData } from '@rainbow-me/handlers/localstorage/removeWallet';
import WalletLoadingStates from '@rainbow-me/helpers/walletLoadingStates';
import {
  useAccountSettings,
  useDimensions,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors, margin, padding } from '@rainbow-me/styles';

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

const samsungGalaxy = (android && isSamsungGalaxy()) || false;

export default function RestoreCloudStep({ userData }) {
  const { isTinyPhone } = useDimensions();
  const { goBack, replace } = useNavigation();
  const { setIsWalletLoading } = useWallets();
  const { accountAddress } = useAccountSettings();
  const [validPassword, setValidPassword] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('􀎽 Confirm Backup');
  const passwordRef = useRef();

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

      newLabel = `􀑙 Restore from ${cloudPlatform}`;
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
      type="restore"
    >
      <Masthead>
        {(isTinyPhone || samsungGalaxy) && isKeyboardOpen ? null : (
          <MastheadIcon>􀙶</MastheadIcon>
        )}
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
