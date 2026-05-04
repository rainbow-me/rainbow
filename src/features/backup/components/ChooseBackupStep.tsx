import React, { useCallback } from 'react';

import { type Source } from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import WalletAndBackup from '@/assets/WalletsAndBackup.png';
import ActivityIndicator from '@/components/ActivityIndicator';
import { ImgixImage } from '@/components/images';
import { Page } from '@/components/layout';
import Spinner from '@/components/Spinner';
import { Text as RNText } from '@/components/text';
import { Box, Stack } from '@/design-system';
import { IS_ANDROID } from '@/env';
import styled from '@/framework/ui/styled-thing';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import Menu from '@/screens/SettingsSheet/components/Menu';
import MenuContainer from '@/screens/SettingsSheet/components/MenuContainer';
import MenuItem from '@/screens/SettingsSheet/components/MenuItem';
import { dateFormatter, titleForBackupState } from '@/screens/SettingsSheet/utils';
import { margin, padding } from '@/styles';
import { useTheme } from '@/theme/ThemeContext';

import { parseTimestampFromFilename, type BackupFile } from '../backup';
import { backupsStore, CloudBackupState, LoadingStates } from '../stores/backupsStore';

const Title = styled(RNText).attrs({
  align: 'left',
  size: 'big',
  weight: 'heavy',
})({
  ...margin.object(15, 0, 12),
});

const LoadingText = styled(RNText).attrs(({ theme: { colors } }: any) => ({
  color: colors.blueGreyDark,
  lineHeight: ios ? 'none' : 24,
  size: 'large',
  weight: 'semibold',
}))({
  marginLeft: 8,
});

const Masthead = styled(Box).attrs({
  direction: 'column',
})({
  ...padding.object(0, 0, 16),
  gap: 8,
  flexShrink: 0,
});

export function ChooseBackupStep() {
  const { colors } = useTheme();

  const status = backupsStore(state => state.status);
  const backups = backupsStore(state => state.backups);
  const mostRecentBackup = backupsStore(state => state.mostRecentBackup);

  const isLoading = LoadingStates.includes(status);

  const { top } = useSafeAreaInsets();
  const { height: deviceHeight } = useDimensions();
  const { navigate } = useNavigation();

  const onSelectCloudBackup = useCallback(
    (selectedBackup: BackupFile) => {
      navigate(Routes.RESTORE_CLOUD_SHEET, {
        selectedBackup,
      });
    },
    [navigate]
  );

  const height = IS_ANDROID ? deviceHeight - top : deviceHeight - sharedCoolModalTopOffset - 48;
  return (
    <Box height={{ custom: height }}>
      <MenuContainer>
        <Stack alignHorizontal="left" space="8px">
          <Masthead>
            <Box
              as={ImgixImage}
              borderRadius={72 / 2}
              height={{ custom: 72 }}
              marginLeft={{ custom: -12 }}
              marginRight={{ custom: -12 }}
              marginTop={{ custom: 8 }}
              marginBottom={{ custom: -24 }}
              source={WalletAndBackup as Source}
              width={{ custom: 72 }}
              size={72}
            />
            <Stack space="12px">
              <Title>{i18n.t(i18n.l.back_up.cloud.choose_backup)}</Title>
            </Stack>
          </Masthead>

          {status === CloudBackupState.FailedToInitialize && (
            <Stack width="full" space="44px">
              <Menu>
                <MenuItem
                  disabled
                  width="full"
                  size={60}
                  titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.failed_to_fetch_backups)} />}
                />
              </Menu>

              <Menu>
                <MenuItem
                  size={52}
                  width="full"
                  onPress={() => backupsStore.getState().syncAndFetchBackups()}
                  titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.retry)} />}
                />
              </Menu>
            </Stack>
          )}

          {status === CloudBackupState.Ready && backups.files.length === 0 && (
            <Stack width="full" space="44px">
              <Box>
                <Menu>
                  <MenuItem
                    disabled
                    size={52}
                    titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.no_backups)} />}
                  />
                </Menu>
              </Box>

              <Menu>
                <MenuItem
                  size={52}
                  width="full"
                  onPress={() => backupsStore.getState().syncAndFetchBackups()}
                  titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.refresh)} />}
                />
              </Menu>
            </Stack>
          )}

          {status === CloudBackupState.Ready && backups.files.length > 0 && (
            <Stack width="full" space="44px">
              {mostRecentBackup && (
                <Box>
                  <Menu
                    description={i18n.t(i18n.l.back_up.cloud.latest_backup, {
                      date: dateFormatter(mostRecentBackup.lastModified),
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
              )}

              <Box gap={24}>
                <Box>
                  <Menu header={i18n.t(i18n.l.back_up.cloud.older_backups)}>
                    {backups.files
                      .filter(backup => backup.name !== mostRecentBackup?.name)
                      .sort((a, b) => {
                        try {
                          const timestampA = new Date(parseTimestampFromFilename(a.name)).getTime();
                          const timestampB = new Date(parseTimestampFromFilename(b.name)).getTime();
                          return timestampB - timestampA;
                        } catch (error) {
                          return 0;
                        }
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
                                date: dateFormatter(parseTimestampFromFilename(backup.name), 'M/d/yy'),
                                time: dateFormatter(parseTimestampFromFilename(backup.name), 'p'),
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
                    onPress={() => backupsStore.getState().syncAndFetchBackups()}
                    titleComponent={<MenuItem.Title disabled text={i18n.t(i18n.l.back_up.cloud.refresh)} />}
                  />
                </Menu>
              </Box>
            </Stack>
          )}

          {isLoading && (
            <Box width="full" height="full" color={colors.transparent} alignItems="center" justifyContent="center" flex={1} as={Page}>
              {android ? <Spinner color={colors.blueGreyDark} /> : <ActivityIndicator color={colors.blueGreyDark} />}
              <LoadingText>{titleForBackupState[status]}</LoadingText>
            </Box>
          )}
        </Stack>
      </MenuContainer>
    </Box>
  );
}

export default ChooseBackupStep;
