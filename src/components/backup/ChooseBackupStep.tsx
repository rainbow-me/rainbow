import * as lang from '@/languages';
import React, { useCallback } from 'react';
import { Text } from '../text';
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

const Title = styled(Text).attrs({
  align: 'left',
  size: 'big',
  weight: 'heavy',
})({
  ...margin.object(15, 0, 12),
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
    params: { backups, userData, fromSettings },
  } = useRoute<RouteProp<RestoreSheetParams, 'RestoreSheet'>>();

  const { top } = useSafeAreaInsets();

  const { height: deviceHeight } = useDimensions();
  const { navigate } = useNavigation();

  const cloudBackups = backups.files.filter(backup => {
    if (IS_ANDROID) {
      return !backup.name.match(/UserData/i);
    }

    return backup.isFile && backup.size > 0 && !backup.name.match(/UserData/i);
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

          <Stack width="full" space="44px">
            {mostRecentBackup && (
              <Menu
                description={lang.t(lang.l.back_up.cloud.latest_backup, {
                  date: format(parseTimestampFromFilename(mostRecentBackup.name), "M/d/yy 'at' h:mm a"),
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
        </Stack>
      </MenuContainer>
    </Box>
  );
}

export default ChooseBackupStep;
