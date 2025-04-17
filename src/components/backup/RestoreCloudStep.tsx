import WalletAndBackup from '@/assets/WalletsAndBackup.png';
import { Box, Inset, Stack } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { isCloudBackupPasswordValid, normalizeAndroidBackupFilename } from '@/handlers/cloudBackup';
import { WrappedAlert as Alert } from '@/helpers/alert';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import { useDimensions, useInitializeWallet } from '@/hooks';
import * as lang from '@/languages';
import { logger } from '@/logger';
import {
  BackupFile,
  getLocalBackupPassword,
  restoreCloudBackup,
  RestoreCloudBackupResultStates,
  saveLocalBackupPassword,
} from '@/model/backup';
import { Navigation, useNavigation } from '@/navigation';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import Routes from '@/navigation/routesNames';
import { loadWallets, setAllWalletsWithIdsAsBackedUp, useWalletsStore } from '@/state/wallets/walletsStore';
import { RestoreSheetParams } from '@/screens/RestoreSheet';
import { backupsStore } from '@/state/backups/backups';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { ThemeContextProps, useTheme } from '@/theme';
import { cloudPlatform } from '@/utils/platform';
import { RouteProp, useRoute } from '@react-navigation/native';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager, TextInput } from 'react-native';
import { Source } from 'react-native-fast-image';
import { KeyboardArea } from 'react-native-keyboard-area';
import { useDispatch } from 'react-redux';
import { RainbowButton } from '../buttons';
import RainbowButtonTypes from '../buttons/rainbow-button/RainbowButtonTypes';
import { PasswordField } from '../fields';
import { ImgixImage } from '../images';
import { Text } from '../text';

type ComponentProps = {
  theme: ThemeContextProps;
  color: ThemeContextProps['colors'][keyof ThemeContextProps['colors']];
};

const Title = styled(Text).attrs({
  size: 'big',
  weight: 'heavy',
})({
  ...padding.object(12, 0, 0),
});

const DescriptionText = styled(Text).attrs(({ theme: { colors }, color }: ComponentProps) => ({
  align: 'left',
  color: color || colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'lmedium',
  weight: 'medium',
}))({});

const ButtonText = styled(Text).attrs(({ theme: { colors }, color }: ComponentProps) => ({
  align: 'center',
  letterSpacing: 'rounded',
  color: color || colors.alpha(colors.blueGreyDark, 0.5),
  size: 'larger',
  weight: 'heavy',
  numberOfLines: 1,
}))({});

const Masthead = styled(Box).attrs({
  direction: 'column',
})({
  ...padding.object(0, 0, 16),
  gap: 8,
  flexShrink: 0,
});

const KeyboardSizeView = styled(KeyboardArea)({
  backgroundColor: ({ theme: { colors } }: ComponentProps) => colors.transparent,
});

type RestoreCloudStepParams = {
  RestoreSheet: {
    selectedBackup: BackupFile;
  };
};

export default function RestoreCloudStep() {
  const { params } = useRoute<RouteProp<RestoreCloudStepParams & RestoreSheetParams, 'RestoreSheet'>>();
  const { password } = backupsStore(state => ({
    password: state.password,
  }));

  const loadingState = walletLoadingStore(state => state.loadingState);

  const { selectedBackup } = params;
  const { isDarkMode } = useTheme();
  const { canGoBack, goBack } = useNavigation();

  const onRestoreSuccess = useCallback(() => {
    while (canGoBack()) {
      goBack();
    }
  }, [canGoBack, goBack]);

  const dispatch = useDispatch();
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const [validPassword, setValidPassword] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const passwordRef = useRef<TextInput | null>(null);
  const initializeWallet = useInitializeWallet();

  useEffect(() => {
    const fetchPasswordIfPossible = async () => {
      const pwd = await getLocalBackupPassword();
      if (pwd) {
        backupsStore.getState().setStoredPassword(pwd);
        backupsStore.getState().setPassword(pwd);
      }
    };
    fetchPasswordIfPossible();
  }, []);

  useEffect(() => {
    let passwordIsValid = false;
    if (isCloudBackupPasswordValid(password)) {
      passwordIsValid = true;
    }

    setValidPassword(passwordIsValid);
  }, [incorrectPassword, password]);

  const onPasswordChange = useCallback(({ nativeEvent: { text: inputText } }: { nativeEvent: { text: string } }) => {
    backupsStore.getState().setPassword(inputText);
    setIncorrectPassword(false);
  }, []);

  const onSubmit = useCallback(async () => {
    // NOTE: Localizing password to prevent an empty string from being saved if we re-render
    const pwd = password.trim();
    let filename = selectedBackup.name;

    const prevWalletsState = await loadWallets();

    try {
      if (!selectedBackup.name) {
        throw new Error('No backup file selected');
      }

      walletLoadingStore.setState({
        loadingState: WalletLoadingStates.RESTORING_WALLET,
      });
      const status = await restoreCloudBackup({
        password: pwd,
        backupFilename: filename,
      });
      if (status === RestoreCloudBackupResultStates.success) {
        // Store it in the keychain in case it was missing
        if (backupsStore.getState().storedPassword !== pwd) {
          await saveLocalBackupPassword(pwd);
        }

        // Reset the storedPassword state for next restoration process
        if (backupsStore.getState().storedPassword) {
          backupsStore.getState().setStoredPassword('');
        }

        InteractionManager.runAfterInteractions(async () => {
          const newWalletsState = await loadWallets();
          if (IS_ANDROID && filename) {
            filename = normalizeAndroidBackupFilename(filename);
          }

          logger.debug('[RestoreCloudStep]: Done updating backup state');
          // NOTE: Marking the restored wallets as backed up
          const walletIdsToUpdate = Object.keys(newWalletsState || {}).filter(walletId => !(prevWalletsState || {})[walletId]);

          logger.debug('[RestoreCloudStep]: Updating backup state of wallets with ids', {
            walletIds: JSON.stringify(walletIdsToUpdate),
          });
          logger.debug('[RestoreCloudStep]: Selected backup name', {
            fileName: selectedBackup.name,
          });

          setAllWalletsWithIdsAsBackedUp(walletIdsToUpdate, walletBackupTypes.cloud, filename);

          const oldCloudIds: string[] = [];
          const oldManualIds: string[] = [];
          // NOTE: Looping over previous wallets and restoring backup state of that wallet
          Object.values(prevWalletsState || {}).forEach(wallet => {
            // NOTE: This handles cloud and manual backups
            if (wallet.backedUp && wallet.backupType === walletBackupTypes.cloud) {
              oldCloudIds.push(wallet.id);
            } else if (wallet.backedUp && wallet.backupType === walletBackupTypes.manual) {
              oldManualIds.push(wallet.id);
            }
          });

          setAllWalletsWithIdsAsBackedUp(oldCloudIds, walletBackupTypes.cloud, filename);
          setAllWalletsWithIdsAsBackedUp(oldManualIds, walletBackupTypes.manual, filename);

          const walletKeys = Object.keys(newWalletsState || {});
          const firstWallet = walletKeys.length > 0 ? (newWalletsState || {})[walletKeys[0]] : undefined;
          const firstAddress = firstWallet ? (firstWallet.addresses || [])[0].address : undefined;

          if (firstWallet && firstAddress) {
            const { setSelectedAddress, setSelectedWallet } = useWalletsStore.getState();
            setSelectedWallet(firstWallet);
            setSelectedAddress(firstAddress);
            await initializeWallet({
              shouldRunMigrations: false,
              overwrite: false,
              switching: true,
            });
          }
        });

        onRestoreSuccess();
        backupsStore.getState().setPassword('');
        if (isEmpty(prevWalletsState)) {
          Navigation.handleAction(
            Routes.SWIPE_LAYOUT,
            {
              screen: Routes.WALLET_SCREEN,
            },
            true
          );
        } else {
          Navigation.handleAction(Routes.WALLET_SCREEN, {});
        }
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
    } finally {
      walletLoadingStore.setState({
        loadingState: null,
      });
    }
  }, [password, selectedBackup.name, dispatch, onRestoreSuccess, initializeWallet]);

  const onPasswordSubmit = useCallback(() => {
    validPassword && onSubmit();
  }, [onSubmit, validPassword]);

  return (
    <Box height={{ custom: deviceHeight - sharedCoolModalTopOffset - 48 }}>
      <Inset horizontal={'24px'}>
        <Stack alignHorizontal="left" space="8px">
          <Masthead>
            <Box
              as={ImgixImage}
              borderRadius={72 / 2}
              height={{ custom: 72 }}
              marginLeft={{ custom: -12 }}
              marginRight={{ custom: -12 }}
              marginTop={{ custom: 8 }}
              marginBottom={{ custom: -24 }}
              source={WalletAndBackup as Source}
              width={{ custom: 72 }}
              size={72}
            />
            <Stack space="4px">
              <Title>{lang.t(lang.l.back_up.cloud.password.enter_backup_password)}</Title>
              <DescriptionText>{lang.t(lang.l.back_up.cloud.password.to_restore_from_backup)}</DescriptionText>
            </Stack>
          </Masthead>
          <Box gap={12}>
            <PasswordField
              autoFocus
              editable={!loadingState}
              isInvalid={incorrectPassword}
              onChange={onPasswordChange}
              onSubmitEditing={onPasswordSubmit}
              password={password}
              placeholder={lang.t('back_up.restore_cloud.backup_password_placeholder')}
              ref={passwordRef}
              returnKeyType="next"
            />
          </Box>
        </Stack>

        <Box paddingTop="16px" justifyContent="flex-start">
          {validPassword && (
            <RainbowButton
              height={46}
              width={deviceWidth - 48}
              disabled={!validPassword || !!loadingState}
              type={RainbowButtonTypes.backup}
              label={
                loadingState
                  ? `${lang.t(lang.l.back_up.cloud.restoration_in_progress)}`
                  : `􀎽 ${lang.t(lang.l.back_up.cloud.restore_from_platform, {
                      cloudPlatformName: cloudPlatform,
                    })}`
              }
              onPress={onSubmit}
            />
          )}

          {!validPassword && (
            <Box
              borderRadius={99}
              alignItems="center"
              justifyContent="center"
              style={{ borderWidth: 1, borderColor: isDarkMode ? 'rgba(245, 248, 255, 0.04)' : 'rgba(9, 17, 31, 0.04)' }}
              height={{ custom: 46 }}
              width="full"
            >
              <ButtonText>
                {`􀎽 ${lang.t(lang.l.back_up.cloud.restore_from_platform, {
                  cloudPlatformName: cloudPlatform,
                })}`}
              </ButtonText>
            </Box>
          )}

          {IS_ANDROID ? <KeyboardSizeView /> : null}
        </Box>
      </Inset>
    </Box>
  );
}
