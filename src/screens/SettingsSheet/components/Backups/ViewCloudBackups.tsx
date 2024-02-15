import { RouteProp, useRoute } from '@react-navigation/native';

import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import { Backup, CloudBackups, parseTimestampFromFilename } from '@/model/backup';
import { format } from 'date-fns';
import { Stack } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { IS_ANDROID } from '@/env';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';

type ViewCloudBackupsParams = {
  ViewCloudBackups: {
    backups: CloudBackups;
  };
};

const ViewCloudBackups = () => {
  const { navigate } = useNavigation();
  const { params } = useRoute<RouteProp<ViewCloudBackupsParams, 'ViewCloudBackups'>>();

  const { backups } = params;

  const cloudBackups = backups.files
    .filter(backup => {
      if (IS_ANDROID) {
        return !backup.name.match(/UserData/i);
      }

      return backup.isFile && backup.size > 0 && !backup.name.match(/UserData/i);
    })
    .sort((a, b) => {
      return parseTimestampFromFilename(b.name) - parseTimestampFromFilename(a.name);
    });
  const mostRecentBackup = cloudBackups.reduce(
    (prev, current) => {
      if (!current) {
        return prev;
      }

      if (!prev) {
        return current;
      }

      const prevTimestamp = parseTimestampFromFilename(prev.name);
      const currentTimestamp = parseTimestampFromFilename(current.name);

      if (currentTimestamp > prevTimestamp) {
        return current;
      }

      return prev;
    },
    undefined as Backup | undefined
  );

  const onSelectCloudBackup = useCallback(
    async (selectedBackup: Backup) => {
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
