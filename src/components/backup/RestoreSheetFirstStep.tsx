import React, { useEffect } from 'react';
import { DebugLayout, globalColors, Inset } from '@/design-system';
import { IS_IOS } from '@/env';
import { cloudPlatform } from '../../utils/platform';
import lang from 'i18n-js';
import { AddWalletItem } from './AddWalletRow';
import { AddWalletList } from './AddWalletList';
import { HARDWARE_WALLETS, useExperimentalFlag } from '@/config';

export const RestoreSheetFirstStep = ({ walletsBackedUp }: any) => {
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);

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
  };

  const restoreFromSeed: AddWalletItem = {
    title: lang.t('back_up.restore_sheet.from_key.secret_phrase_title'),
    description: lang.t(
      'back_up.restore_sheet.from_key.secret_phrase_description'
    ),
    icon: '􀑚',
    iconColor: globalColors.purple60,
  };

  const watchAddress: AddWalletItem = {
    title: lang.t('back_up.restore_sheet.watch_address.watch_title'),
    description: lang.t(
      'back_up.restore_sheet.watch_address.watch_description'
    ),
    icon: '􀒒',
    iconColor: globalColors.green60,
  };

  const importFromHardwareWallet: AddWalletItem = {
    title: lang.t('back_up.restore_sheet.from_hardware_wallet.title'),
    description: lang.t(
      'back_up.restore_sheet.from_hardware_wallet.description'
    ),
    icon: '􀕹',
    iconColor: globalColors.blue60,
  };

  const items = hardwareWalletsEnabled
    ? [
        restoreFromCloud,
        restoreFromSeed,
        importFromHardwareWallet,
        watchAddress,
      ]
    : [restoreFromCloud, restoreFromSeed, watchAddress];

  return (
    <Inset top="36px" horizontal="30px (Deprecated)">
      <AddWalletList items={items} totalHorizontalInset={30} />
    </Inset>
  );
};
