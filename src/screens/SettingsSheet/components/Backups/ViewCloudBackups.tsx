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
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { Centered } from '@/components/layout';
import Spinner from '@/components/Spinner';
import ActivityIndicator from '@/components/ActivityIndicator';
import { cloudPlatform } from '@/utils/platform';
import { useTheme } from '@/theme';
import { useCloudBackupsContext, CloudBackupState } from '@/components/backup/CloudBackupProvider';

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
  const { backupState, backups, mostRecentBackup } = useCloudBackupsContext();

  const onSelectCloudBackup = useCallback(
    async (selectedBackup: Backup) => {
      navigate(Routes.BACKUP_SHEET, {
        step: walletBackupStepTypes.restore_from_backup,
        selectedBackup,
      });
    },
    [navigate]
  );

  const renderNoBackupsState = () => (
    <MenuContainer>
      <Menu header={i18n.t(i18n.l.back_up.cloud.latest_backup)}>
        <MenuItem disabled size={52} titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.no_backups)} />} />
      </Menu>
    </MenuContainer>
  );

  const renderMostRecentBackup = () => {
    if (!mostRecentBackup) {
      return null;
    }

    return (
      <MenuContainer space="4px">
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
      </MenuContainer>
    );
  };

  const renderOlderBackups = () => (
    <MenuContainer space="8px">
      <Menu header={i18n.t(i18n.l.back_up.cloud.older_backups)}>
        {backups.files
          .filter(backup => backup.name !== mostRecentBackup?.name)
          .sort((a, b) => {
            const timestampA = new Date(parseTimestampFromFilename(a.name)).getTime();
            const timestampB = new Date(parseTimestampFromFilename(b.name)).getTime();
            return timestampB - timestampA;
          })
          .map(backup => (
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
          ))}
        {backups.files.length === 1 && (
          <MenuItem disabled size={52} titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.no_older_backups)} />} />
        )}
      </Menu>
    </MenuContainer>
  );

  const renderBackupsList = () => (
    <>
      {renderMostRecentBackup()}
      {renderOlderBackups()}
    </>
  );

  const isLoading =
    backupState === CloudBackupState.Initializing || backupState === CloudBackupState.Syncing || backupState === CloudBackupState.Fetching;

  if (isLoading) {
    return (
      <Centered zIndex={2}>
        {android ? <Spinner color={colors.blueGreyDark} /> : <ActivityIndicator color={colors.blueGreyDark} />}
        <LoadingText>
          {i18n.t(i18n.l.back_up.cloud.fetching_backups, {
            cloudPlatformName: cloudPlatform,
          })}
        </LoadingText>
      </Centered>
    );
  }

  return (
    <>
      {backupState === CloudBackupState.Ready && !backups.files.length && renderNoBackupsState()}
      {backupState === CloudBackupState.Ready && backups.files.length > 0 && renderBackupsList()}
    </>
  );
};

export default ViewCloudBackups;
