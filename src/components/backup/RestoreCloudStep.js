import lang from 'i18n-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager, Keyboard } from 'react-native';
import { useDispatch } from 'react-redux';
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
import { WrappedAlert as Alert } from '@/helpers/alert';
import {
  cloudBackupPasswordMinLength,
  isCloudBackupPasswordValid,
} from '@/handlers/cloudBackup';
import { removeWalletData } from '@/handlers/localstorage/removeWallet';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import {
  useDimensions,
  useInitializeWallet,
  useKeyboardHeight,
  useUserAccounts,
  useWallets,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import {
  addressSetSelected,
  setWalletBackedUp,
  walletsLoadState,
  walletsSetSelected,
} from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { margin, padding } from '@/styles';
import logger from '@/utils/logger';
import { Box } from '@/design-system';
import { deviceUtils } from '@/utils';
import { IS_ANDROID } from '@/env';

const DescriptionText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.blueGreyDark50,
  lineHeight: 'looser',
  size: 'large',
}))({});

const Masthead = styled(Centered).attrs({
  direction: 'column',
})({
  ...padding.object(24, 50, 39),
  flexShrink: 0,
});

const MastheadIcon = styled(GradientText).attrs({
  align: 'center',
  angle: false,
  colors: ['#FFB114', '#FF54BB', '#00F0FF'],
  end: { x: 0, y: 0 },
  size: 52,
  start: { x: 1, y: 1 },
  steps: [0, 0.5, 1],
  weight: 'bold',
})({});

const Title = styled(Text).attrs({
  align: 'center',
  size: 'big',
  weight: 'bold',
})({
  ...margin.object(15, 0, 12),
});

const samsungGalaxy = (android && isSamsungGalaxy()) || false;

export default function RestoreCloudStep({
  userData,
  backupSelected,
  fromSettings,
}) {
  const dispatch = useDispatch();
  const { isTinyPhone, scale } = useDimensions();
  const { navigate, goBack, replace } = useNavigation();
  const { setIsWalletLoading } = useWallets();
  const [validPassword, setValidPassword] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState(
    `􀎽 ${lang.t('back_up.restore_cloud.confirm_backup')}`
  );
  const passwordRef = useRef();
  const { userAccounts } = useUserAccounts();
  const initializeWallet = useInitializeWallet();

  const isScaleMoreThanDefault = scale > 3;

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
      newLabel = lang.t('back_up.restore_cloud.incorrect_password');
    } else {
      if (isCloudBackupPasswordValid(password)) {
        passwordIsValid = true;
      }

      newLabel = `􀑙 ${lang.t(
        'back_up.restore_cloud.restore_from_cloud_platform',
        {
          cloudPlatformName: cloudPlatform,
        }
      )}`;
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
                    backupSelected?.name,
                    false
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
      Alert.alert(lang.t('back_up.restore_cloud.error_while_restoring'));
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

  const keyboardHeight = useKeyboardHeight();

  return (
    <Box
      height={{
        custom:
          deviceUtils.dimensions.height - (IS_ANDROID ? keyboardHeight : 0),
      }}
    >
      <BackupSheetKeyboardLayout
        footerButtonDisabled={!validPassword}
        footerButtonLabel={label}
        onSubmit={onSubmit}
        type="restore"
      >
        <Masthead>
          {(isTinyPhone || samsungGalaxy || isScaleMoreThanDefault) &&
          isKeyboardOpen ? null : (
            <MastheadIcon>􀙶</MastheadIcon>
          )}
          <Title>{lang.t('back_up.restore_cloud.enter_backup_password')}</Title>
          <DescriptionText>
            {lang.t('back_up.restore_cloud.enter_backup_password_description')}
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
            placeholder={lang.t(
              'back_up.restore_cloud.backup_password_placeholder'
            )}
            ref={passwordRef}
            returnKeyType="next"
          />
        </Column>
      </BackupSheetKeyboardLayout>
    </Box>
  );
}
