import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import { parseTimestampFromFilename } from '@/model/backup';
import { format } from 'date-fns';
import { Stack } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import useCloudBackups from '@/hooks/useCloudBackups';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { RainbowWallet } from '@/model/wallet';

const ViewCloudBackups = () => {
  const { backups } = useCloudBackups();
  const { navigate } = useNavigation();

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
              date: format(parseTimestampFromFilename(mostRecentBackup.name), "M/d/yy 'at' h:mm a"),
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
              backup.name !== mostRecentBackup?.name && (
                <MenuItem
                  key={backup.name}
                  size={52}
                  onPress={() => onSelectCloudBackup(backup)}
                  titleComponent={
                    <MenuItem.Title
                      isLink
                      text={i18n.t(i18n.l.back_up.cloud.older_backups_title, {
                        date: format(parseTimestampFromFilename(backup.name), 'M/d/yy'),
                        time: format(parseTimestampFromFilename(backup.name), 'p'),
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
