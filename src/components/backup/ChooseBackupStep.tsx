import * as lang from '@/languages';
import React, { useCallback } from 'react';
import { Text as RNText } from '../text';
import WalletAndBackup from '@/assets/WalletsAndBackup.png';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { margin, padding } from '@/styles';
import { Box, Stack } from '@/design-system';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { ImgixImage } from '@/components/images';
import MenuContainer from '@/screens/SettingsSheet/components/MenuContainer';
import Menu from '@/screens/SettingsSheet/components/Menu';
import MenuItem from '@/screens/SettingsSheet/components/MenuItem';
import Routes from '@/navigation/routesNames';
import { BackupFile, parseTimestampFromFilename } from '@/model/backup';
import { Source } from 'react-native-fast-image';
import { IS_ANDROID } from '@/env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Page } from '@/components/layout';
import Spinner from '@/components/Spinner';
import ActivityIndicator from '@/components/ActivityIndicator';
import { useTheme } from '@/theme';
import { backupsStore, CloudBackupState, LoadingStates } from '@/state/backups/backups';
import { dateFormatter, titleForBackupState } from '@/screens/SettingsSheet/utils';

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

  const { status, backups, mostRecentBackup } = backupsStore(state => ({
    status: state.status,
    backups: state.backups,
    mostRecentBackup: state.mostRecentBackup,
  }));

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
              <Title>{lang.t(lang.l.back_up.cloud.choose_backup)}</Title>
            </Stack>
          </Masthead>

          {status === CloudBackupState.FailedToInitialize && (
            <Stack width="full" space="44px">
              <Menu>
                <MenuItem
                  disabled
                  width="full"
                  size={60}
                  titleComponent={<MenuItem.Title disabled text={lang.t(lang.l.back_up.cloud.failed_to_fetch_backups)} />}
                />
              </Menu>

              <Menu>
                <MenuItem
                  size={52}
                  width="full"
                  onPress={() => backupsStore.getState().syncAndFetchBackups()}
                  titleComponent={<MenuItem.Title disabled text={lang.t(lang.l.back_up.cloud.retry)} />}
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
                    titleComponent={<MenuItem.Title disabled text={lang.t(lang.l.back_up.cloud.no_backups)} />}
                  />
                </Menu>
              </Box>

              <Menu>
                <MenuItem
                  size={52}
                  width="full"
                  onPress={() => backupsStore.getState().syncAndFetchBackups()}
                  titleComponent={<MenuItem.Title disabled text={lang.t(lang.l.back_up.cloud.refresh)} />}
                />
              </Menu>
            </Stack>
          )}

          {status === CloudBackupState.Ready && backups.files.length > 0 && (
            <Stack width="full" space="44px">
              {mostRecentBackup && (
                <Box>
                  <Menu
                    description={lang.t(lang.l.back_up.cloud.latest_backup, {
                      date: dateFormatter(mostRecentBackup.lastModified),
                    })}
                  >
                    <MenuItem
                      hasSfSymbol
                      leftComponent={<MenuItem.TextIcon icon="􀣔" isLink />}
                      onPress={() => onSelectCloudBackup(mostRecentBackup)}
                      size={52}
                      width="full"
                      titleComponent={<MenuItem.Title isLink text={lang.t(lang.l.back_up.cloud.most_recent_backup)} />}
                    />
                  </Menu>
                </Box>
              )}

              <Box gap={24}>
                <Box>
                  <Menu header={lang.t(lang.l.back_up.cloud.older_backups)}>
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
                              text={lang.t(lang.l.back_up.cloud.older_backups_title, {
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
                        titleComponent={<MenuItem.Title disabled text={lang.t(lang.l.back_up.cloud.no_older_backups)} />}
                      />
                    )}
                  </Menu>
                </Box>

                <Menu>
                  <MenuItem
                    size={52}
                    width="full"
                    onPress={() => backupsStore.getState().syncAndFetchBackups()}
                    titleComponent={<MenuItem.Title disabled text={lang.t(lang.l.back_up.cloud.refresh)} />}
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
