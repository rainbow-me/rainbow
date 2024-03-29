import * as lang from '@/languages';
import React, { useCallback } from 'react';
import { Text as RNText } from '../text';
import WalletAndBackup from '@/assets/WalletsAndBackup.png';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { margin, padding } from '@/styles';
import { Box, Stack } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { ImgixImage } from '../images';
import MenuContainer from '@/screens/SettingsSheet/components/MenuContainer';
import Menu from '@/screens/SettingsSheet/components/Menu';
import { format } from 'date-fns';
import MenuItem from '@/screens/SettingsSheet/components/MenuItem';
import Routes from '@/navigation/routesNames';
import { Backup, parseTimestampFromFilename } from '@/model/backup';
import { RestoreSheetParams } from '@/screens/RestoreSheet';
import { Source } from 'react-native-fast-image';
import { IS_ANDROID } from '@/env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useCloudBackups, { CloudBackupStep } from '@/hooks/useCloudBackups';
import { Centered } from '../layout';
import { cloudPlatform } from '@/utils/platform';
import Spinner from '../Spinner';
import ActivityIndicator from '../ActivityIndicator';
import { useTheme } from '@/theme';

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
  const {
    params: { fromSettings },
  } = useRoute<RouteProp<RestoreSheetParams, 'RestoreSheet'>>();
  const { colors } = useTheme();

  const { isFetching, backups, userData, step, fetchBackups } = useCloudBackups();

  const { top } = useSafeAreaInsets();
  const { height: deviceHeight } = useDimensions();
  const { navigate } = useNavigation();

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
    (selectedBackup: Backup) => {
      navigate(Routes.RESTORE_CLOUD_SHEET, {
        backups,
        userData,
        selectedBackup,
        fromSettings,
      });
    },
    [navigate, userData, backups, fromSettings]
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

          {!isFetching && step === CloudBackupStep.FAILED && (
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
                  onPress={fetchBackups}
                  titleComponent={<MenuItem.Title disabled text={lang.t(lang.l.back_up.cloud.retry)} />}
                />
              </Menu>
            </Stack>
          )}

          {!isFetching && !cloudBackups.length && step !== CloudBackupStep.FAILED && (
            <Stack width="full" space="44px">
              <Menu>
                <MenuItem disabled size={52} titleComponent={<MenuItem.Title disabled text={lang.t(lang.l.back_up.cloud.no_backups)} />} />
              </Menu>
            </Stack>
          )}

          {!isFetching && cloudBackups.length && (
            <Stack width="full" space="44px">
              {mostRecentBackup && (
                <Menu
                  description={lang.t(lang.l.back_up.cloud.latest_backup, {
                    date: format(new Date(mostRecentBackup.lastModified), "M/d/yy 'at' h:mm a"),
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
              )}

              <Menu header={lang.t(lang.l.back_up.cloud.older_backups)}>
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
                            text={lang.t(lang.l.back_up.cloud.older_backups_title, {
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
                    titleComponent={<MenuItem.Title disabled text={lang.t(lang.l.back_up.cloud.no_older_backups)} />}
                  />
                )}
              </Menu>
            </Stack>
          )}

          {isFetching && (
            <Centered zIndex={2}>
              {android ? <Spinner color={colors.blueGreyDark} /> : <ActivityIndicator color={colors.blueGreyDark} />}
              {
                <LoadingText>
                  {lang.t(lang.l.back_up.cloud.fetching_backups, {
                    cloudPlatformName: cloudPlatform,
                  })}
                </LoadingText>
              }
            </Centered>
          )}
        </Stack>
      </MenuContainer>
    </Box>
  );
}

export default ChooseBackupStep;
