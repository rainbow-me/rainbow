import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import { BackupUserData } from '@/model/backup';
import { format } from 'date-fns';
import { Stack } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { RainbowWallet } from '@/model/wallet';
import { RouteProp, useRoute } from '@react-navigation/native';

type ViewCloudBackupsParams = {
  ViewCloudBackups: {
    backups: BackupUserData;
  };
};

const ViewCloudBackups = () => {
  const { params } = useRoute<RouteProp<ViewCloudBackupsParams, 'ViewCloudBackups'>>();
  const { navigate } = useNavigation();

  const { backups } = params;

  const cloudBackups = Object.values(backups.wallets || {})
    .filter(backup => backup.backedUp && backup.backupType === walletBackupTypes.cloud)
    .sort((a, b) => Number(a.backupDate) - Number(b.backupDate));

  const mostRecentBackup = cloudBackups.reduce((prev, current) => {
    if (!current.backedUp) {
      return prev;
    }

    if (!prev.backedUp && current.backedUp) {
      return current;
    }

    const currentTimestamp = Number(current.backupDate);
    const prevTimestamp = Number(prev.backupDate);
    if (currentTimestamp > prevTimestamp) {
      return current;
    }

    return prev;
  }, {} as RainbowWallet);

  const onSelectCloudBackup = useCallback(
    async (selectedBackup: RainbowWallet) => {
      navigate(Routes.BACKUP_SHEET, {
        step: walletBackupStepTypes.restore_from_backup,
        selectedBackup,
      });
    },
    [navigate]
  );

  return (
    <MenuContainer>
      <Stack space="44px">
        {mostRecentBackup && (
          <Menu
            description={i18n.t(i18n.l.back_up.cloud.latest_backup, {
              date: format(new Date(mostRecentBackup.backupDate!), "M/d/yy 'at' h:mm a"),
            })}
          >
            <MenuItem
              hasSfSymbol
              leftComponent={<MenuItem.TextIcon icon="􀣔" isLink />}
              size={52}
              onPress={() => onSelectCloudBackup(mostRecentBackup)}
              titleComponent={<MenuItem.Title isLink text={i18n.t(i18n.l.back_up.cloud.most_recent_backup)} />}
            />
          </Menu>
        )}

        <Menu header={i18n.t(i18n.l.back_up.cloud.older_backups)}>
          {cloudBackups.map(
            backup =>
              backup.id !== mostRecentBackup?.id && (
                <MenuItem
                  key={backup.id}
                  size={52}
                  onPress={() => onSelectCloudBackup(backup)}
                  titleComponent={
                    <MenuItem.Title
                      isLink
                      text={i18n.t(i18n.l.back_up.cloud.older_backups_title, {
                        date: format(new Date(backup.backupDate!), 'M/d/yy'),
                        time: format(new Date(backup.backupDate!), 'p'),
                      })}
                    />
                  }
                />
              )
          )}

          {cloudBackups.length === 1 && (
            <MenuItem
              disabled
              size={52}
              titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.no_older_backups)} />}
            />
          )}
        </Menu>
      </Stack>
    </MenuContainer>
  );
};

export default ViewCloudBackups;
