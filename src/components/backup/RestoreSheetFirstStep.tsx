import React, { useEffect, useMemo } from 'react';
import { globalColors, Inset } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { cloudPlatform } from '../../utils/platform';
import lang from 'i18n-js';
import { AddWalletItem } from './AddWalletRow';
import { AddWalletList } from './AddWalletList';
import { HARDWARE_WALLETS, useExperimentalFlag } from '@/config';
import { RainbowWallet } from '@/model/wallet';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { useNavigation } from '@/navigation';

export const RestoreSheetFirstStep = ({
  onCloudRestore,
  onManualRestore,
  onWatchAddress,
  userData,
}: any) => {
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const { setParams } = useNavigation();

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

  const enableCloudRestore = IS_ANDROID || walletsBackedUp > 0;
  useEffect(() => {
    setParams({ enableCloudRestore });
  }, [enableCloudRestore, hardwareWalletsEnabled, setParams]);

  const restoreFromCloud: AddWalletItem = {
    title: lang.t(
      'back_up.restore_sheet.from_backup.restore_from_cloud_platform',
      { cloudPlatformName: cloudPlatform }
    ),
    description: IS_IOS
      ? // It is not possible for the user to be on iOS and have
        // no backups at this point, since `enableCloudRestore`
        // would be false in that case.
        walletsBackedUp > 1
        ? lang.t(
            'back_up.restore_sheet.from_backup.ios.you_have_multiple_wallets',
            {
              walletsBackedUpCount: walletsBackedUp,
            }
          )
        : lang.t('back_up.restore_sheet.from_backup.ios.you_have_1_wallet')
      : lang.t(
          'back_up.restore_sheet.from_backup.non_ios.if_you_previously_backed_up',
          {
            cloudPlatformName: cloudPlatform,
          }
        ),
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
    <Inset top="36px" horizontal="30px (Deprecated)">
      <AddWalletList
        items={[
          ...(enableCloudRestore ? [restoreFromCloud] : []),
          restoreFromSeed,
          ...(hardwareWalletsEnabled ? [importFromHardwareWallet] : []),
          watchAddress,
        ]}
        totalHorizontalInset={30}
      />
    </Inset>
  );
};
