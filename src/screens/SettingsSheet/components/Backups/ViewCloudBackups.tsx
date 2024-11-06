import * as i18n from '@/languages';
import styled from '@/styled-thing';
import React, { useCallback } from 'react';
import { Text as RNText } from '@/components/text';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import { Backup, parseTimestampFromFilename } from '@/model/backup';
import { format } from 'date-fns';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { Centered, Page } from '@/components/layout';
import Spinner from '@/components/Spinner';
import ActivityIndicator from '@/components/ActivityIndicator';
import { useTheme } from '@/theme';
import { useCloudBackupsContext, CloudBackupState } from '@/components/backup/CloudBackupProvider';
import { titleForBackupState } from '../../utils';
import { Box } from '@/design-system';

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
  const { backupState, backups, mostRecentBackup, syncAndFetchBackups } = useCloudBackupsContext();

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
    <>
      <Menu header={i18n.t(i18n.l.back_up.cloud.latest_backup)}>
        <MenuItem disabled size={52} titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.no_backups)} />} />
      </Menu>
    </>
  );

  const renderMostRecentBackup = () => {
    if (!mostRecentBackup) {
      return null;
    }

    return (
      <Box>
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
      </Box>
    );
  };

  const renderOlderBackups = () => (
    <>
      <Box>
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
            <MenuItem
              disabled
              size={52}
              titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.no_older_backups)} />}
            />
          )}
        </Menu>
      </Box>

      <Menu>
        <MenuItem
          size={52}
          width="full"
          onPress={syncAndFetchBackups}
          titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.refresh)} />}
        />
      </Menu>
    </>
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
      <Box color={colors.transparent} alignItems="center" justifyContent="center" flex={1} as={Page}>
        {android ? <Spinner color={colors.blueGreyDark} /> : <ActivityIndicator color={colors.blueGreyDark} />}
        <LoadingText>{titleForBackupState[backupState]}</LoadingText>
      </Box>
    );
  }

  return (
    <MenuContainer>
      {backupState === CloudBackupState.Ready && !backups.files.length && renderNoBackupsState()}
      {backupState === CloudBackupState.Ready && backups.files.length > 0 && renderBackupsList()}
    </MenuContainer>
  );
};

export default ViewCloudBackups;
