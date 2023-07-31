import lang from 'i18n-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  EmitterSubscription,
  InteractionManager,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { isSamsungGalaxy } from '@/helpers/samsung';
import {
  BackupUserData,
  fetchBackupPassword,
  restoreCloudBackup,
  RestoreCloudBackupResultStates,
  saveBackupPassword,
} from '@/model/backup';
import { cloudPlatform } from '@/utils/platform';
import { PasswordField } from '../fields';
import { Centered, Column } from '../layout';
import { GradientText, Text } from '../text';
import BackupSheetKeyboardLayout from './BackupSheetKeyboardLayout';
import { WrappedAlert as Alert } from '@/helpers/alert';
import {
  cloudBackupPasswordMinLength,
  isCloudBackupPasswordValid,
  normalizeAndroidBackupFilename,
} from '@/handlers/cloudBackup';
import { removeWalletData } from '@/handlers/localstorage/removeWallet';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import {
  useDimensions,
  useInitializeWallet,
  useKeyboardHeight,
  useUserAccounts,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import {
  addressSetSelected,
  setAllWalletsWithIdsAsBackedUp,
  walletsLoadState,
  walletsSetSelected,
} from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { margin, padding } from '@/styles';
import { logger } from '@/logger';
import { Box } from '@/design-system';
import { deviceUtils } from '@/utils';
import { IS_ANDROID } from '@/env';
import { useTheme } from '@/theme';

const Title = styled(Text).attrs({
  align: 'center',
  size: 'big',
  weight: 'bold',
})({
  ...margin.object(15, 0, 12),
});

const samsungGalaxy = (android && isSamsungGalaxy()) || false;
const MASTHEAD_ICON_COLORS = ['#FFB114', '#FF54BB', '#00F0FF'];
const MASTHEAD_ICON_SIZE = 52;
const MASTHEAD_ICON_GRADIENT_START_POINT = { x: 1, y: 1 };
const MASTHEAD_ICON_GRADIENT_END_POINT = { x: 0, y: 0 };
const MASTHEAD_ICON_GRADIENT_STEPS = [0, 0.5, 1];

type Props = {
  userData: BackupUserData;
  backupSelected: { name: string | null };
  fromSettings: boolean;
};

export default function RestoreCloudStep({
  userData,
  backupSelected,
  fromSettings,
}: Props) {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { isTinyPhone, scale } = useDimensions();
  // @ts-expect-error useNavigation contains replace function in this case, but it's not typed properly
  const { navigate, goBack, replace } = useNavigation();
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
  const keyboardShowListener = useRef<EmitterSubscription>();
  const keyboardHideListener = useRef<EmitterSubscription>();

  const isScaleMoreThanDefault = scale > 3;

  useEffect(() => {
    const keyboardDidShow = () => {
      setIsKeyboardOpen(true);
    };

    const keyboardDidHide = () => {
      setIsKeyboardOpen(false);
    };
    keyboardShowListener.current = Keyboard.addListener(
      'keyboardDidShow',
      keyboardDidShow
    );
    keyboardHideListener.current = Keyboard.addListener(
      'keyboardDidHide',
      keyboardDidHide
    );
    return () => {
      keyboardShowListener.current?.remove();
      keyboardHideListener.current?.remove();
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
    ({
      nativeEvent: { text: inputText },
    }: {
      nativeEvent: { text: string };
    }) => {
      setPassword(inputText);
      setIncorrectPassword(false);
    },
    []
  );

  const onSubmit = useCallback(async () => {
    try {
      const status = await restoreCloudBackup({
        password,
        userData,
        backupSelected: backupSelected?.name,
      });
      if (status === RestoreCloudBackupResultStates.success) {
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
            logger.info('Updating backup state of wallets');
            let filename = backupSelected?.name;
            if (IS_ANDROID && filename) {
              /**
               * We need to normalize the filename on Android, because sometimes
               * the filename is returned with the path used for Google Drive storage.
               * That is with REMOTE_BACKUP_WALLET_DIR included.
               */
              filename = normalizeAndroidBackupFilename(filename);
            }
            const walletIdsToUpdate = Object.keys(wallets);
            logger.log('updating backup state of wallets with ids', {
              walletIds: JSON.stringify(walletIdsToUpdate),
            });
            logger.log('backupSelected?.name', {
              fileName: backupSelected?.name,
            });
            await dispatch(
              setAllWalletsWithIdsAsBackedUp(
                walletIdsToUpdate,
                walletBackupTypes.cloud,
                filename,
                false
              )
            );
            logger.info('Done updating backup state');
          }
          // @ts-expect-error TypeScript doesn't play nicely with Redux types here
          const firstWallet = wallets[Object.keys(wallets)[0]];
          const firstAddress = firstWallet.addresses[0].address;
          const p1 = dispatch(walletsSetSelected(firstWallet));
          const p2 = dispatch(addressSetSelected(firstAddress));
          await Promise.all([p1, p2]);
          await initializeWallet(
            null,
            null,
            null,
            false,
            false,
            null,
            true,
            null
          );
          if (fromSettings) {
            logger.info('Navigating to wallet');
            navigate(Routes.WALLET_SCREEN);
            logger.info('Initializing wallet');
          } else {
            replace(Routes.SWIPE_LAYOUT);
          }
        });
      } else {
        switch (status) {
          case RestoreCloudBackupResultStates.incorrectPassword:
            setIncorrectPassword(true);
            break;
          case RestoreCloudBackupResultStates.incorrectPinCode:
            Alert.alert(lang.t('back_up.restore_cloud.incorrect_pin_code'));
            break;
          default:
            Alert.alert(lang.t('back_up.restore_cloud.error_while_restoring'));
            break;
        }
      }
    } catch (e) {
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
    userAccounts,
    userData,
  ]);

  const onPasswordSubmit = useCallback(() => {
    validPassword && onSubmit();
  }, [onSubmit, validPassword]);

  const keyboardHeight = useKeyboardHeight();

  const isPasswordValid =
    (password !== '' &&
      password.length < cloudBackupPasswordMinLength &&
      // @ts-expect-error the ref is untyped and the component that receives is in JS
      !passwordRef?.current?.isFocused?.()) ||
    incorrectPassword;

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
        <Centered direction="column" style={styles.masthead}>
          {(isTinyPhone || samsungGalaxy || isScaleMoreThanDefault) &&
          isKeyboardOpen ? null : (
            // @ts-expect-error JS component
            <GradientText
              align="center"
              angle={false}
              colors={MASTHEAD_ICON_COLORS}
              end={MASTHEAD_ICON_GRADIENT_END_POINT}
              size={MASTHEAD_ICON_SIZE}
              start={MASTHEAD_ICON_GRADIENT_START_POINT}
              steps={MASTHEAD_ICON_GRADIENT_STEPS}
              weight="bold"
            >
              􀙶
            </GradientText>
          )}
          <Title>{lang.t('back_up.restore_cloud.enter_backup_password')}</Title>
          <Text
            align="center"
            color={colors.blueGreyDark50}
            lineHeight="looser"
            size="large"
          >
            {lang.t('back_up.restore_cloud.enter_backup_password_description')}
          </Text>
        </Centered>
        <Column align="center" flex={1}>
          <PasswordField
            autoFocus
            isInvalid={isPasswordValid}
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

const styles = StyleSheet.create({
  masthead: {
    ...padding.object(24, 50, 39),
    flexShrink: 0,
  },
});
