import { AddWalletList } from '@/components/add-wallet/AddWalletList';
import { AddWalletItem } from '@/components/add-wallet/AddWalletRow';
import { Box, globalColors, Inset, Stack, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import React, { useMemo, useRef } from 'react';
import * as i18n from '@/languages';
import { HARDWARE_WALLETS, PROFILES, useExperimentalFlag } from '@/config';
import { analytics, analyticsV2 } from '@/analytics';
import { InteractionManager, View } from 'react-native';
import { createAccountForWallet, walletsLoadState } from '@/redux/wallets';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { createWallet, RainbowWallet } from '@/model/wallet';
import WalletTypes from '@/helpers/walletTypes';
import { logger, RainbowError } from '@/logger';
import { captureException } from '@sentry/react-native';
import { useDispatch } from 'react-redux';
import {
  backupUserDataIntoCloud,
  fetchUserDataFromCloud,
  isCloudBackupAvailable,
  logoutFromGoogleDrive,
} from '@/handlers/cloudBackup';
import showWalletErrorAlert from '@/helpers/support';
import { cloudPlatform } from '@/utils/platform';
import { IS_ANDROID, IS_IOS } from '@/env';
import { RouteProp, useRoute } from '@react-navigation/native';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { useInitializeWallet, useWallets } from '@/hooks';

const TRANSLATIONS = i18n.l.wallet.new.add_wallet_sheet;

export type AddWalletSheetParams = {
  isFirstWallet: boolean;
  userData: { wallets: RainbowWallet[] };
};

type RouteParams = {
  AddWalletSheetParams: AddWalletSheetParams;
};

export const AddWalletSheet = () => {
  const {
    params: { isFirstWallet, userData },
  } = useRoute<RouteProp<RouteParams, 'AddWalletSheetParams'>>();

  const { goBack, navigate } = useNavigation();

  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const dispatch = useDispatch();
  const initializeWallet = useInitializeWallet();
  const creatingWallet = useRef<boolean>();
  const { isDamaged, selectedWallet, wallets } = useWallets();

  const walletsBackedUp = useMemo(() => {
    let count = 0;
    if (userData?.wallets) {
      Object.values(userData.wallets as RainbowWallet[]).forEach(wallet => {
        if (wallet.backedUp && wallet.backupType === WalletBackupTypes.cloud) {
          count += 1;
        }
      });
    }
    return count;
  }, [userData]);

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
                let primaryWalletKey = selectedWallet.primary
                  ? selectedWallet.id
                  : null;

                // If it's not, then find it
                !primaryWalletKey &&
                  Object.keys(wallets as any).some(key => {
                    const wallet = wallets?.[key];
                    if (
                      wallet?.type === WalletTypes.mnemonic &&
                      wallet.primary
                    ) {
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
                    if (
                      wallet?.type === WalletTypes.mnemonic &&
                      wallet.imported
                    ) {
                      primaryWalletKey = key;
                      return true;
                    }
                    return false;
                  });
                try {
                  // If we found it and it's not damaged use it to create the new account
                  if (
                    primaryWalletKey &&
                    !wallets?.[primaryWalletKey].damaged
                  ) {
                    const newWallets = await dispatch(
                      createAccountForWallet(primaryWalletKey, color, name)
                    );
                    // @ts-ignore
                    await initializeWallet();
                    // If this wallet was previously backed up to the cloud
                    // We need to update userData backup so it can be restored too
                    if (
                      wallets?.[primaryWalletKey].backedUp &&
                      wallets[primaryWalletKey].backupType ===
                        WalletBackupTypes.cloud
                    ) {
                      try {
                        await backupUserDataIntoCloud({ wallets: newWallets });
                      } catch (e) {
                        logger.error(e as RainbowError, {
                          description:
                            'Updating wallet userdata failed after new account creation',
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
      await logoutFromGoogleDrive();
      const isAvailable = await isCloudBackupAvailable();
      if (isAvailable) {
        let proceed = false;
        try {
          const data = await fetchUserDataFromCloud();
          if (data?.wallets) {
            Object.values(data.wallets as RainbowWallet[]).forEach(wallet => {
              if (
                wallet.backedUp &&
                wallet.backupType === WalletBackupTypes.cloud
              ) {
                proceed = true;
              }
            });
            if (proceed) {
              navigate(Routes.RESTORE_SHEET, { userData: data });
            }
          }
          logger.info(`Downloaded ${cloudPlatform} backup info`);
        } catch (e) {
          logger.error(e as RainbowError);
        } finally {
          if (!proceed) {
            Alert.alert(
              i18n.t(TRANSLATIONS.options.cloud.no_backups),
              i18n.t(TRANSLATIONS.options.cloud.no_google_backups)
            );
          }
        }
      }
    } else {
      navigate(Routes.RESTORE_SHEET, { userData });
    }
  };

  const cloudRestoreEnabled =
    isFirstWallet && (IS_ANDROID || walletsBackedUp > 0);

  let restoreFromCloudDescription;
  if (IS_IOS) {
    // It is not possible for the user to be on iOS and have
    // no backups at this point, since `cloudRestoreEnabled`
    // would be false in that case.
    if (walletsBackedUp > 1) {
      restoreFromCloudDescription = i18n.t(
        TRANSLATIONS.options.cloud.description_ios_multiple_wallets,
        {
          walletCount: walletsBackedUp,
        }
      );
    } else {
      restoreFromCloudDescription = i18n.t(
        TRANSLATIONS.options.cloud.description_ios_one_wallet
      );
    }
  } else {
    restoreFromCloudDescription = i18n.t(
      TRANSLATIONS.options.cloud.description_android
    );
  }

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
    icon: '􀁌',
    iconColor: globalColors.pink60,
    testID: 'create-new-button',
    onPress: onPressCreate,
  };

  const restoreFromCloud: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.cloud.title, {
      platform: cloudPlatform,
    }),
    description: restoreFromCloudDescription,
    icon: '􀌍',
    onPress: onPressRestoreFromCloud,
  };

  const restoreFromSeed: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.seed.title),
    description: i18n.t(TRANSLATIONS.options.seed.description),
    icon: '􀑚',
    iconColor: globalColors.purple60,
    testID: 'restore-with-key-button',
    onPress: onPressRestoreFromSeed,
  };

  const watch: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.watch.title),
    description: i18n.t(TRANSLATIONS.options.watch.description),
    icon: '􀒒',
    iconColor: globalColors.green60,
    testID: 'watch-address-button',
    onPress: onPressWatch,
  };

  const connectHardwareWallet: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.hardware_wallet.title),
    description: i18n.t(TRANSLATIONS.options.hardware_wallet.description),
    icon: '􀕹',
    iconColor: globalColors.blue60,
    testID: 'connect-hardware-wallet-button',
    onPress: onPressConnectHardwareWallet,
  };

  return (
    <Box
      height="full"
      width="full"
      background="surfaceSecondary"
      testID="add-wallet-sheet"
    >
      <Inset horizontal="20px" top="36px" bottom="104px">
        <Stack space="32px">
          <Stack space="20px">
            <Text align="center" size="26pt" weight="bold" color="label">
              {i18n.t(
                TRANSLATIONS[
                  isFirstWallet ? 'first_wallet' : 'additional_wallet'
                ].title
              )}
            </Text>
            <Text
              align="center"
              size="15pt / 135%"
              weight="semibold"
              color="labelTertiary"
            >
              {i18n.t(
                TRANSLATIONS[
                  isFirstWallet ? 'first_wallet' : 'additional_wallet'
                ].description
              )}
            </Text>
          </Stack>
          <View
            style={{
              shadowColor: globalColors.grey100,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 3,
            }}
          >
            <View
              style={{
                shadowColor: globalColors.grey100,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.16,
                shadowRadius: 6,
              }}
            >
              <Box
                paddingVertical="24px"
                paddingHorizontal="20px"
                background="surfaceSecondaryElevated"
                borderRadius={18}
              >
                <AddWalletList
                  totalHorizontalInset={40}
                  items={[
                    ...(!isFirstWallet ? [create] : []),
                    ...(cloudRestoreEnabled ? [restoreFromCloud] : []),
                    restoreFromSeed,
                    ...(hardwareWalletsEnabled ? [connectHardwareWallet] : []),
                    watch,
                  ]}
                />
              </Box>
            </View>
          </View>
        </Stack>
      </Inset>
    </Box>
  );
};
