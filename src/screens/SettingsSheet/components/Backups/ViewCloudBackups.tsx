import * as i18n from '@/languages';
import styled from '@/styled-thing';
import React, { useCallback } from 'react';
import { Text as RNText } from '@/components/text';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import { Backup, parseTimestampFromFilename } from '@/model/backup';
import { format } from 'date-fns';
import { Stack } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { IS_ANDROID } from '@/env';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { useCloudBackups } from '@/components/backup/CloudBackupProvider';
import { Centered } from '@/components/layout';
import Spinner from '@/components/Spinner';
import ActivityIndicator from '@/components/ActivityIndicator';
import { cloudPlatform } from '@/utils/platform';
import { useTheme } from '@/theme';

const LoadingText = styled(RNText).attrs(({ theme: { colors } }: any) => ({
  color: colors.blueGreyDark,
  lineHeight: ios ? 'none' : 24,
  size: 'large',
  weight: 'semibold',
}))({
  marginLeft: 8,
});

const ViewCloudBackups = () => {
  const { navigate } = useNavigation();

  const { colors } = useTheme();
  const { isFetching, backups } = useCloudBackups();

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

      const prevTimestamp = new Date(prev.lastModified).getTime();
      const currentTimestamp = new Date(current.lastModified).getTime();
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
        {!isFetching && !cloudBackups.length && (
          <Menu header={i18n.t(i18n.l.back_up.cloud.latest_backup)}>
            <MenuItem disabled size={52} titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.no_backups)} />} />
          </Menu>
        )}

        {!isFetching && cloudBackups.length && (
          <>
            {mostRecentBackup && (
              <Menu
                description={i18n.t(i18n.l.back_up.cloud.latest_backup, {
                  date: format(new Date(mostRecentBackup.lastModified), "M/d/yy 'at' h:mm a"),
                })}
              >
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀣔" isLink />}
                  onPress={() => onSelectCloudBackup(mostRecentBackup)}
                  size={52}
                  width="full"
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
                      onPress={() => onSelectCloudBackup(backup)}
                      size={52}
                      width="full"
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
          </>
        )}

        {isFetching && (
          <Centered zIndex={2}>
            {android ? <Spinner color={colors.blueGreyDark} /> : <ActivityIndicator color={colors.blueGreyDark} />}
            {
              <LoadingText>
                {i18n.t(i18n.l.back_up.cloud.fetching_backups, {
                  cloudPlatformName: cloudPlatform,
                })}
              </LoadingText>
            }
          </Centered>
        )}
      </Stack>
    </MenuContainer>
  );
};

export default ViewCloudBackups;
