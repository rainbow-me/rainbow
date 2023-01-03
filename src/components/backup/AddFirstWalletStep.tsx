import React, { useCallback, useMemo } from 'react';
import { globalColors, Inset } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { HARDWARE_WALLETS, useExperimentalFlag } from '@/config';
import { RainbowWallet } from '@/model/wallet';
import WalletBackupTypes from '@/helpers/walletBackupStepTypes';
import { useNavigation } from '@/navigation';
import { analyticsV2 } from '@/analytics';
import { InteractionManager } from 'react-native';
import Routes from '@/navigation/routesNames';
import { AddWalletList } from '@/components/add-wallet/AddWalletList';
import { AddWalletItem } from '@/components/add-wallet/AddWalletRow';
import { cloudPlatform } from '@/utils/platform';
import * as i18n from '@/languages';
import {
  fetchUserDataFromCloud,
  isCloudBackupAvailable,
} from '@/handlers/cloudBackup';
import { logger } from '@/logger';
// @ts-ignore ts is complaining about this import
import RNCloudFs from 'react-native-cloud-fs';
import { WrappedAlert as Alert } from '@/helpers/alert';

const TRANSLATIONS = i18n.l.wallet.new.add_first_wallet;

type Props = {
  userData: { wallets: RainbowWallet[] };
};

export const AddFirstWalletStep = ({ userData }: Props) => {
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const { goBack, navigate, setParams } = useNavigation();

  const walletsBackedUp = useMemo(() => {
    let count = 0;
    if (userData?.wallets) {
      Object.values(userData.wallets).forEach(wallet => {
        if (wallet.backedUp && wallet.backupType === WalletBackupTypes.cloud) {
          count += 1;
        }
      });
    }
    return count;
  }, [userData]);

  const onCloudRestore = useCallback(async () => {
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet: true,
      type: 'seed',
    });
    let proceed = false;
    if (IS_ANDROID) {
      const isAvailable = await isCloudBackupAvailable();
      if (isAvailable) {
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
              setParams({ userData: data });
            }
          }
          logger.info(`Downloaded ${cloudPlatform} backup info`);
        } catch (e) {
          logger.info((e as Error).message);
        } finally {
          if (!proceed) {
            Alert.alert(
              i18n.t(TRANSLATIONS.cloud.no_backups),
              i18n.t(TRANSLATIONS.cloud.no_google_backups)
            );
            await RNCloudFs.logout();
          }
        }
      }
    } else {
      proceed = true;
    }
    if (proceed) {
      setParams({ step: WalletBackupTypes.cloud });
    }
  }, [setParams]);

  const onManualRestore = useCallback(() => {
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet: true,
      type: 'seed',
    });
    InteractionManager.runAfterInteractions(goBack);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => navigate(Routes.IMPORT_SEED_PHRASE_FLOW), 50);
    });
  }, [goBack, navigate]);

  const onWatchAddress = useCallback(() => {
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet: true,
      type: 'watch',
    });
    InteractionManager.runAfterInteractions(goBack);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => navigate(Routes.IMPORT_SEED_PHRASE_FLOW), 50);
    });
  }, [goBack, navigate]);

  const cloudRestoreEnabled = IS_ANDROID || walletsBackedUp > 0;

  let restoreFromCloudDescription;
  if (IS_IOS) {
    // It is not possible for the user to be on iOS and have
    // no backups at this point, since `cloudRestoreEnabled`
    // would be false in that case.
    if (walletsBackedUp > 1) {
      restoreFromCloudDescription = i18n.t(
        TRANSLATIONS.cloud.description_ios_multiple_wallets,
        {
          walletCount: walletsBackedUp,
        }
      );
    } else {
      restoreFromCloudDescription = i18n.t(
        TRANSLATIONS.cloud.description_ios_one_wallet
      );
    }
  } else {
    restoreFromCloudDescription = i18n.t(
      TRANSLATIONS.cloud.description_android
    );
  }

  const restoreFromCloud: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.cloud.title, { platform: cloudPlatform }),
    description: restoreFromCloudDescription,
    icon: '􀌍',
    onPress: onCloudRestore,
  };

  const restoreFromSeed: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.seed.title),
    description: i18n.t(TRANSLATIONS.seed.description),
    icon: '􀑚',
    iconColor: globalColors.purple60,
    testID: 'restore-with-key-button',
    onPress: onManualRestore,
  };

  const watchAddress: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.watch.title),
    description: i18n.t(TRANSLATIONS.watch.description),
    icon: '􀒒',
    iconColor: globalColors.green60,
    testID: 'watch-address-button',
    onPress: onWatchAddress,
  };

  const connectHardwareWallet: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.hardware_wallet.title),
    description: i18n.t(TRANSLATIONS.hardware_wallet.description),
    icon: '􀕹',
    iconColor: globalColors.blue60,
    onPress: () => {},
  };

  return (
    <Inset top="36px" horizontal="30px (Deprecated)" bottom="80px">
      <AddWalletList
        items={[
          ...(cloudRestoreEnabled ? [restoreFromCloud] : []),
          restoreFromSeed,
          ...(hardwareWalletsEnabled ? [connectHardwareWallet] : []),
          watchAddress,
        ]}
        totalHorizontalInset={30}
      />
    </Inset>
  );
};
