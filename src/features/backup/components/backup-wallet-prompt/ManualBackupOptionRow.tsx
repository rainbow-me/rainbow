import { useCallback } from 'react';

import ManuallyBackedUpIcon from '@/assets/ManuallyBackedUp.png';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useSelectedWallet } from '@/state/wallets/walletsStore';

import { BackupOptionRow } from './BackupOptionRow';

export function ManualBackupOptionRow() {
  const { navigate, goBack } = useNavigation();
  const selectedWallet = useSelectedWallet();

  const onPress = useCallback(() => {
    if (!selectedWallet) return;

    const title =
      selectedWallet?.imported && selectedWallet.type === WalletTypes.privateKey
        ? (selectedWallet.addresses || [])[0].label
        : selectedWallet.name;

    goBack();
    navigate(Routes.SETTINGS_SHEET, {
      screen: Routes.SECRET_WARNING,
      params: {
        isBackingUp: true,
        title,
        backupType: walletBackupTypes.manual,
        walletId: selectedWallet.id,
      },
    });
  }, [goBack, navigate, selectedWallet]);

  return (
    <BackupOptionRow icon={ManuallyBackedUpIcon} header={i18n.t(i18n.l.back_up.cloud.manual_backup)} onPress={onPress}>
      {i18n.t(i18n.l.back_up.cloud.choose_backup_manual_description)}
    </BackupOptionRow>
  );
}
