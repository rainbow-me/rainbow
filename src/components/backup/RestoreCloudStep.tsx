import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, InteractionManager, Keyboard } from 'react-native';
import { useDispatch } from 'react-redux';
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
// @ts-expect-error ts-migrate(6142) FIXME: Module './BackupSheetKeyboardLayout' was resolved ... Remove this comment to see the full error message
import BackupSheetKeyboardLayout from './BackupSheetKeyboardLayout';
import {
  cloudBackupPasswordMinLength,
  isCloudBackupPasswordValid,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/cloudBack... Remove this comment to see the full error message
} from '@rainbow-me/handlers/cloudBackup';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/localstor... Remove this comment to see the full error message
import { removeWalletData } from '@rainbow-me/handlers/localstorage/removeWallet';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import walletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletLoad... Remove this comment to see the full error message
import WalletLoadingStates from '@rainbow-me/helpers/walletLoadingStates';
import {
  useDimensions,
  useInitializeWallet,
  useUserAccounts,
  useWallets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
import {
  addressSetSelected,
  setWalletBackedUp,
  walletsLoadState,
  walletsSetSelected,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/wallets' or ... Remove this comment to see the full error message
} from '@rainbow-me/redux/wallets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { margin, padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const DescriptionText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.blueGreyDark50,
  lineHeight: 'looser',
  size: 'large',
}))``;

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

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const samsungGalaxy = (android && isSamsungGalaxy()) || false;

export default function RestoreCloudStep({
  userData,
  backupSelected,
  fromSettings,
}: any) {
  const dispatch = useDispatch();
  const { isTinyPhone } = useDimensions();
  const { navigate, goBack, replace } = useNavigation();
  const { setIsWalletLoading } = useWallets();
  const [validPassword, setValidPassword] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('􀎽 Confirm Backup');
  const passwordRef = useRef();
  const { userAccounts } = useUserAccounts();
  const initializeWallet = useInitializeWallet();

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
      const success = await restoreCloudBackup(
        password,
        userData,
        backupSelected?.name
      );
      if (success) {
        // Store it in the keychain in case it was missing
        await saveBackupPassword(password);

        // Get rid of the old wallets
        for (let i = 0; i < userAccounts.length; i++) {
          const account = userAccounts[i];
          await removeWalletData(account.address);
        }

        goBack();

        InteractionManager.runAfterInteractions(async () => {
          const wallets = await dispatch(walletsLoadState());
          if (!userData && backupSelected?.name) {
            goBack();
            logger.log('updating backup state of wallets');
            await Promise.all(
              Object.keys(wallets).map(walletId => {
                logger.log('updating backup state of wallet', walletId);
                logger.log('backupSelected?.name', backupSelected?.name);
                // Mark the wallet as backed up
                return dispatch(
                  setWalletBackedUp(
                    walletId,
                    walletBackupTypes.cloud,
                    backupSelected?.name
                  )
                );
              })
            );
            logger.log('done updating backup state');
          }
          const firstWallet = wallets[Object.keys(wallets)[0]];
          const firstAddress = firstWallet.addresses[0].address;
          const p1 = dispatch(walletsSetSelected(firstWallet));
          const p2 = dispatch(addressSetSelected(firstAddress));
          await Promise.all([p1, p2]);
          await initializeWallet(null, null, null, false, false, null, true);
          if (fromSettings) {
            logger.log('navigating to wallet');
            navigate(Routes.WALLET_SCREEN);
            logger.log('initializing wallet');
          } else {
            replace(Routes.SWIPE_LAYOUT);
          }
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
  }, [
    backupSelected?.name,
    dispatch,
    fromSettings,
    goBack,
    initializeWallet,
    navigate,
    password,
    replace,
    setIsWalletLoading,
    userAccounts,
    userData,
  ]);

  const onPasswordSubmit = useCallback(() => {
    validPassword && onSubmit();
  }, [onSubmit, validPassword]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <BackupSheetKeyboardLayout
      footerButtonDisabled={!validPassword}
      footerButtonLabel={label}
      onSubmit={onSubmit}
      type="restore"
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Masthead>
        {(isTinyPhone || samsungGalaxy) && isKeyboardOpen ? null : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <MastheadIcon>􀙶</MastheadIcon>
        )}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Title>Enter backup password</Title>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <DescriptionText>
          To restore your wallet, enter the backup password you created
        </DescriptionText>
      </Masthead>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Column align="center" flex={1}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <PasswordField
          autoFocus
          isInvalid={
            (password !== '' &&
              password.length < cloudBackupPasswordMinLength &&
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'isFocused' does not exist on type 'never... Remove this comment to see the full error message
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
