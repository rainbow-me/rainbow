import React, { useCallback, useEffect, useMemo } from 'react';
import { globalColors, Inset } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { cloudPlatform } from '../../utils/platform';
import lang from 'i18n-js';
import { AddWalletItem } from './AddWalletRow';
import { AddWalletList } from './AddWalletList';
import { HARDWARE_WALLETS, useExperimentalFlag } from '@/config';
import { RainbowWallet } from '@/model/wallet';
import WalletBackupTypes from '@/helpers/walletBackupStepTypes';
import { useNavigation } from '@/navigation';
import { SlackSheet } from '../sheet';
import { useRoute } from '@react-navigation/native';
import { analytics } from '@/analytics';
import { InteractionManager } from 'react-native';
import Routes from '@/navigation/routesNames';
import { getAddWalletSheetHeight } from '@/screens/AddFirstWalletSheet';

export const AddWalletSheet = () => {
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const { goBack, navigate, setParams } = useNavigation();
  const {
    params: {
      longFormHeight = 0,
      step = WalletBackupTypes.first,
      userData,
      backupSelected,
      fromSettings,
    } = {},
  } = useRoute<any>();

  const walletsBackedUp = useMemo(() => {
    let count = 0;
    if (userData?.wallets) {
      (Object.values(userData.wallets) as RainbowWallet[]).forEach(
        (wallet: RainbowWallet) => {
          if (
            wallet.backedUp &&
            wallet.backupType === WalletBackupTypes.cloud
          ) {
            count += 1;
          }
        }
      );
    }
    return count;
  }, [userData]);

  const onManualRestore = useCallback(() => {
    analytics.track('Tapped "Restore with a secret phrase or private key"');
    InteractionManager.runAfterInteractions(goBack);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => navigate(Routes.IMPORT_SEED_PHRASE_FLOW), 50);
    });
  }, [goBack, navigate]);

  const onWatchAddress = useCallback(() => {
    analytics.track('Tapped "Watch an Ethereum Address"');
    InteractionManager.runAfterInteractions(goBack);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => navigate(Routes.IMPORT_SEED_PHRASE_FLOW), 50);
    });
  }, [goBack, navigate]);

  const onCloudRestore = useCallback(() => {
    analytics.track('Tapped "Restore from cloud"');
    InteractionManager.runAfterInteractions(goBack);
    // TODO: Add cloud restore
    // InteractionManager.runAfterInteractions(() => {
    //   setTimeout(() => navigate(Routes.RESTORE_FROM_CLOUD_SHEET), 50);
    // });
  }, [goBack, navigate]);

  const cloudRestoreEnabled = IS_ANDROID || walletsBackedUp > 0;
  const sheetHeight = getAddWalletSheetHeight(
    hardwareWalletsEnabled,
    cloudRestoreEnabled
  );
  useEffect(() => {
    setParams({ sheetHeight });
  }, [sheetHeight, setParams]);

  let restoreFromCloudDescription;
  if (IS_IOS) {
    // It is not possible for the user to be on iOS and have
    // no backups at this point, since `cloudRestoreEnabled`
    // would be false in that case.
    if (walletsBackedUp > 1) {
      restoreFromCloudDescription = lang.t(
        'back_up.restore_sheet.from_backup.ios.you_have_multiple_wallets',
        {
          walletsBackedUpCount: walletsBackedUp,
        }
      );
    } else {
      restoreFromCloudDescription = lang.t(
        'back_up.restore_sheet.from_backup.ios.you_have_1_wallet'
      );
    }
  } else {
    restoreFromCloudDescription = lang.t(
      'back_up.restore_sheet.from_backup.non_ios.if_you_previously_backed_up',
      {
        cloudPlatformName: cloudPlatform,
      }
    );
  }

  const restoreFromCloud: AddWalletItem = {
    title: lang.t(
      'back_up.restore_sheet.from_backup.restore_from_cloud_platform',
      { cloudPlatformName: cloudPlatform }
    ),
    description: restoreFromCloudDescription,
    icon: '􀌍',
    onPress: onCloudRestore,
  };

  const restoreFromSeed: AddWalletItem = {
    title: lang.t('back_up.restore_sheet.from_key.secret_phrase_title'),
    description: lang.t(
      'back_up.restore_sheet.from_key.secret_phrase_description'
    ),
    icon: '􀑚',
    iconColor: globalColors.purple60,
    testID: 'restore-with-key-button',
    onPress: onManualRestore,
  };

  const watchAddress: AddWalletItem = {
    title: lang.t('back_up.restore_sheet.watch_address.watch_title'),
    description: lang.t(
      'back_up.restore_sheet.watch_address.watch_description'
    ),
    icon: '􀒒',
    iconColor: globalColors.green60,
    testID: 'watch-address-button',
    onPress: onWatchAddress,
  };

  const importFromHardwareWallet: AddWalletItem = {
    title: lang.t('back_up.restore_sheet.from_hardware_wallet.title'),
    description: lang.t(
      'back_up.restore_sheet.from_hardware_wallet.description'
    ),
    icon: '􀕹',
    iconColor: globalColors.blue60,
    onPress: () => {},
  };

  return (
    <SlackSheet
      contentHeight={longFormHeight}
      deferredHeight={IS_ANDROID}
      testID="restore-sheet"
    >
      <Inset
        top="36px"
        horizontal="30px (Deprecated)"
        bottom={{ custom: IS_ANDROID ? 130 : 0 }}
      >
        <AddWalletList
          items={[
            ...(cloudRestoreEnabled ? [restoreFromCloud] : []),
            restoreFromSeed,
            ...(hardwareWalletsEnabled ? [importFromHardwareWallet] : []),
            watchAddress,
          ]}
          totalHorizontalInset={30}
        />
      </Inset>
    </SlackSheet>
  );
};
