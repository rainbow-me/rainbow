import { AddWalletList } from '@/components/add-wallet/AddWalletList';
import { AddWalletItem } from '@/components/add-wallet/AddWalletRow';
import { Box, globalColors, Inset } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import React, { useRef } from 'react';
import * as i18n from '@/languages';
import { HARDWARE_WALLETS, PROFILES, useExperimentalFlag } from '@/config';
import { analytics, analyticsV2 } from '@/analytics';
import { InteractionManager, Linking } from 'react-native';
import { createAccountForWallet, walletsLoadState } from '@/redux/wallets';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { createWallet } from '@/model/wallet';
import WalletTypes from '@/helpers/walletTypes';
import { logger, RainbowError } from '@/logger';
import WalletsAndBackup from '@/assets/WalletsAndBackup.png';
import CreateNewWallet from '@/assets/CreateNewWallet.png';
import PairHairwareWallet from '@/assets/PairHardwareWallet.png';
import ImportSecretPhraseOrPrivateKey from '@/assets/ImportSecretPhraseOrPrivateKey.png';
import WatchWalletIcon from '@/assets/watchWallet.png';
import { captureException } from '@sentry/react-native';
import { useDispatch } from 'react-redux';
import {
  backupUserDataIntoCloud,
  getGoogleAccountUserData,
  GoogleDriveUserData,
  isCloudBackupAvailable,
  login,
  logoutFromGoogleDrive,
} from '@/handlers/cloudBackup';
import showWalletErrorAlert from '@/helpers/support';
import { cloudPlatform } from '@/utils/platform';
import { IS_ANDROID } from '@/env';
import { RouteProp, useRoute } from '@react-navigation/native';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { useInitializeWallet, useWallets } from '@/hooks';

const TRANSLATIONS = i18n.l.wallet.new.add_wallet_sheet;

export type AddWalletSheetParams = {
  isFirstWallet: boolean;
};

type RouteParams = {
  AddWalletSheetParams: AddWalletSheetParams;
};

export const AddWalletSheet = () => {
  const {
    params: { isFirstWallet },
  } = useRoute<RouteProp<RouteParams, 'AddWalletSheetParams'>>();

  const { goBack, navigate } = useNavigation();

  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const dispatch = useDispatch();
  const initializeWallet = useInitializeWallet();
  const creatingWallet = useRef<boolean>();
  const { isDamaged, selectedWallet, wallets } = useWallets();

  const onPressCreate = async () => {
    try {
      analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
        isFirstWallet,
        type: 'new',
      });
      analytics.track('Tapped "Create a new wallet"');
      if (creatingWallet.current) return;
      creatingWallet.current = true;

      // Show naming modal
      InteractionManager.runAfterInteractions(() => {
        goBack();
      });
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          navigate(Routes.MODAL_SCREEN, {
            actionType: 'Create',
            asset: [],
            isNewProfile: true,
            onCancel: () => {
              creatingWallet.current = false;
            },
            onCloseModal: async (args: any) => {
              if (args) {
                const name = args?.name ?? '';
                const color = args?.color ?? null;
                // Check if the selected wallet is the primary
                let primaryWalletKey = selectedWallet.primary ? selectedWallet.id : null;

                // If it's not, then find it
                !primaryWalletKey &&
                  Object.keys(wallets as any).some(key => {
                    const wallet = wallets?.[key];
                    if (wallet?.type === WalletTypes.mnemonic && wallet.primary) {
                      primaryWalletKey = key;
                      return true;
                    }
                    return false;
                  });

                // If there's no primary wallet at all,
                // we fallback to an imported one with a seed phrase
                !primaryWalletKey &&
                  Object.keys(wallets as any).some(key => {
                    const wallet = wallets?.[key];
                    if (wallet?.type === WalletTypes.mnemonic && wallet.imported) {
                      primaryWalletKey = key;
                      return true;
                    }
                    return false;
                  });
                try {
                  // If we found it and it's not damaged use it to create the new account
                  if (primaryWalletKey && !wallets?.[primaryWalletKey].damaged) {
                    const newWallets = await dispatch(createAccountForWallet(primaryWalletKey, color, name));
                    // @ts-ignore
                    await initializeWallet();
                    // If this wallet was previously backed up to the cloud
                    // We need to update userData backup so it can be restored too
                    if (wallets?.[primaryWalletKey].backedUp && wallets[primaryWalletKey].backupType === WalletBackupTypes.cloud) {
                      try {
                        await backupUserDataIntoCloud({ wallets: newWallets });
                      } catch (e) {
                        logger.error(e as RainbowError, {
                          description: 'Updating wallet userdata failed after new account creation',
                        });
                        captureException(e);
                        throw e;
                      }
                    }

                    // If doesn't exist, we need to create a new wallet
                  } else {
                    await createWallet({
                      color,
                      name,
                      clearCallbackOnStartCreation: true,
                    });
                    await dispatch(walletsLoadState(profilesEnabled));
                    // @ts-ignore
                    await initializeWallet();
                  }
                } catch (e) {
                  logger.error(e as RainbowError, {
                    description: 'Error while trying to add account',
                  });
                  captureException(e);
                  if (isDamaged) {
                    setTimeout(() => {
                      showWalletErrorAlert();
                    }, 1000);
                  }
                }
              }
              creatingWallet.current = false;
            },
            profile: {
              color: null,
              name: ``,
            },
            type: 'wallet_profile',
          });
        }, 50);
      });
    } catch (e) {
      logger.error(e as RainbowError, {
        description: 'Error while trying to add account',
      });
    }
  };

  const onPressRestoreFromSeed = () => {
    analytics.track('Tapped "Add an existing wallet"');
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet,
      type: 'seed',
    });
    navigate(Routes.ADD_WALLET_NAVIGATOR, {
      screen: Routes.IMPORT_OR_WATCH_WALLET_SHEET,
      params: { type: 'import', isFirstWallet },
    });
  };

  const onPressWatch = () => {
    analytics.track('Tapped "Add an existing wallet"');
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet,
      type: 'watch',
    });
    navigate(Routes.ADD_WALLET_NAVIGATOR, {
      screen: Routes.IMPORT_OR_WATCH_WALLET_SHEET,
      params: { type: 'watch', isFirstWallet },
    });
  };

  const onPressRestoreFromCloud = async () => {
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet,
      type: 'seed',
    });
    if (IS_ANDROID) {
      try {
        await logoutFromGoogleDrive();
        await login();

        getGoogleAccountUserData().then((accountDetails: GoogleDriveUserData | undefined) => {
          if (accountDetails) {
            return navigate(Routes.RESTORE_SHEET);
          }
          Alert.alert(i18n.t(i18n.l.back_up.errors.no_account_found));
        });
      } catch (e) {
        Alert.alert(i18n.t(i18n.l.back_up.errors.no_account_found));
        logger.error(e as RainbowError);
      }
    } else {
      const isAvailable = await isCloudBackupAvailable();
      if (!isAvailable) {
        Alert.alert(
          i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.label),
          i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.description),
          [
            {
              onPress: () => {
                Linking.openURL('https://support.apple.com/en-us/HT204025');
              },
              text: i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.show_me),
            },
            {
              style: 'cancel',
              text: i18n.t(i18n.l.modal.back_up.alerts.cloud_not_enabled.no_thanks),
            },
          ]
        );
        return;
      }

      navigate(Routes.RESTORE_SHEET);
    }
  };

  const restoreFromCloudDescription = i18n.t(TRANSLATIONS.options.cloud.description_restore_sheet, {
    cloudPlatform,
  });

  const onPressConnectHardwareWallet = () => {
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet: false,
      type: 'ledger_nano_x',
    });
    goBack();
    InteractionManager.runAfterInteractions(() => {
      navigate(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR, {
        entryPoint: Routes.ADD_WALLET_SHEET,
        isFirstWallet,
      });
    });
  };

  const create: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.create_new.title),
    description: i18n.t(TRANSLATIONS.options.create_new.description),
    icon: CreateNewWallet,
    iconColor: globalColors.pink60,
    testID: 'create-new-button',
    onPress: onPressCreate,
  };

  const restoreFromCloud: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.cloud.title, {
      platform: cloudPlatform,
    }),
    description: restoreFromCloudDescription,
    descriptionColor: 'blue',
    icon: WalletsAndBackup,
    onPress: onPressRestoreFromCloud,
  };

  const restoreFromSeed: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.seed.title),
    description: i18n.t(TRANSLATIONS.options.seed.description),
    icon: ImportSecretPhraseOrPrivateKey,
    testID: 'restore-with-key-button',
    onPress: onPressRestoreFromSeed,
  };

  const watch: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.watch.title),
    description: i18n.t(TRANSLATIONS.options.watch.description),
    icon: WatchWalletIcon,
    testID: 'watch-address-button',
    onPress: onPressWatch,
  };

  const connectHardwareWallet: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.hardware_wallet.title),
    description: i18n.t(TRANSLATIONS.options.hardware_wallet.description),
    icon: PairHairwareWallet,
    iconColor: globalColors.blue60,
    testID: 'connect-hardware-wallet-button',
    onPress: onPressConnectHardwareWallet,
  };

  return (
    <Box height="full" width="full" background="surfaceSecondary" testID="add-wallet-sheet">
      <Inset horizontal="28px" top="36px">
        <AddWalletList
          totalHorizontalInset={24}
          items={[
            ...(!isFirstWallet ? [create] : []),
            ...(isFirstWallet ? [restoreFromCloud] : []),
            restoreFromSeed,
            ...(hardwareWalletsEnabled ? [connectHardwareWallet] : []),
            watch,
          ]}
        />
      </Inset>
    </Box>
  );
};
