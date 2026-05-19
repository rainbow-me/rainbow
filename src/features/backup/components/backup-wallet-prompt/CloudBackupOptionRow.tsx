import { useCallback, useMemo } from 'react';

import WalletsAndBackupIcon from '@/assets/WalletsAndBackup.png';
import { Text } from '@/design-system';
import { type TextColor } from '@/design-system/color/palettes';
import { type CustomColor } from '@/design-system/color/useForegroundColor';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useSelectedWallet } from '@/state/wallets/walletsStore';
import { cloudPlatform } from '@/utils/platform';

import { executeFnIfCloudBackupAvailable } from '../../backup';
import { useCreateBackup } from '../../hooks/useCreateBackup';
import { backupsStore, CloudBackupState } from '../../stores/backupsStore';
import { BackupOptionRow } from './BackupOptionRow';

export function CloudBackupOptionRow() {
  const { navigate, goBack } = useNavigation();
  const selectedWallet = useSelectedWallet();
  const createBackup = useCreateBackup();
  const status = backupsStore(state => state.status);

  const onPress = useCallback(() => {
    if (!selectedWallet) return;

    // pop the bottom sheet, and navigate to the backup section inside settings sheet
    goBack();
    navigate(Routes.SETTINGS_SHEET, {
      screen: Routes.SETTINGS_SECTION_BACKUP,
      initial: false,
    });

    executeFnIfCloudBackupAvailable({
      fn: () =>
        createBackup({
          walletId: selectedWallet.id,
        }),
      logout: true,
    });
  }, [createBackup, goBack, navigate, selectedWallet]);

  const disabled = status !== CloudBackupState.Ready && status !== CloudBackupState.NotAvailable;

  const { color, text } = useMemo<{ text: string; color: TextColor | CustomColor }>(() => {
    if (status === CloudBackupState.FailedToInitialize || status === CloudBackupState.NotAvailable) {
      return {
        text: i18n.t(i18n.l.back_up.cloud.statuses.not_enabled),
        color: 'primary (Deprecated)',
      };
    }

    if (status === CloudBackupState.Ready) {
      return {
        text: i18n.t(i18n.l.back_up.cloud.cloud_backup),
        color: 'primary (Deprecated)',
      };
    }

    return {
      text: i18n.t(i18n.l.back_up.cloud.statuses.syncing),
      color: 'yellow',
    };
  }, [status]);

  return (
    <BackupOptionRow icon={WalletsAndBackupIcon} header={text} headerColor={color} onPress={onPress} disabled={disabled}>
      <Text color={'action (Deprecated)'} size="14px / 19px (Deprecated)" weight="bold">
        {i18n.t(i18n.l.back_up.cloud.recommended_for_beginners)}
      </Text>{' '}
      {i18n.t(i18n.l.back_up.cloud.choose_backup_cloud_description, {
        cloudPlatform,
      })}
    </BackupOptionRow>
  );
}
