import * as lang from '@/languages';
import React, { useCallback } from 'react';
import { Text } from '../text';
import WalletAndBackup from '@/assets/walletsAndBackup.png';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { margin, padding } from '@/styles';
import { Box, Stack } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { ImgixImage } from '../images';
import { AllRainbowWalletsData, RainbowWallet } from '@/model/wallet';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import MenuContainer from '@/screens/SettingsSheet/components/MenuContainer';
import Menu from '@/screens/SettingsSheet/components/Menu';
import { format } from 'date-fns';
import MenuItem from '@/screens/SettingsSheet/components/MenuItem';
import Routes from '@/navigation/routesNames';
import { BackupUserData } from '@/model/backup';

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

type ChooseBackupStepParams = {
  ChooseBackupStep: {
    userData: BackupUserData;
  };
};

export default function ChooseBackupStep() {
  const {
    params: { userData },
  } = useRoute<RouteProp<ChooseBackupStepParams, 'ChooseBackupStep'>>();

  const { height: deviceHeight } = useDimensions();
  const { navigate } = useNavigation();

  const cloudBackups = Object.values(userData.wallets).filter(wallet => {
    return wallet.backupType === walletBackupTypes.cloud && wallet.backedUp;
  });

  const mostRecentBackup = cloudBackups.reduce((prev, current) => {
    if (!current || !current.backedUp || !current.backupDate) {
      return prev;
    }

    if (typeof prev === 'undefined' || !prev.backupDate) {
      return current;
    }

    if (current.backupDate > prev.backupDate) {
      return current;
    }

    return prev;
  }, {} as RainbowWallet);

  const onSelectCloudBackup = useCallback(
    (selectedBackup: RainbowWallet) => {
      navigate(Routes.RESTORE_CLOUD_SHEET, { userData, selectedBackup });
    },
    [navigate, userData]
  );

  return (
    <Box height={{ custom: deviceHeight - sharedCoolModalTopOffset - 48 }}>
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
              source={WalletAndBackup}
              width={{ custom: 72 }}
              size={72}
            />
            <Stack space="12px">
              <Title>{lang.t(lang.l.back_up.cloud.choose_backup)}</Title>
            </Stack>
          </Masthead>

          <Stack space="44px">
            {mostRecentBackup && (
              <Menu
                description={lang.t(lang.l.back_up.cloud.latest_backup, {
                  date: format(
                    mostRecentBackup.backupDate!,
                    "M/d/yy 'at' h:mm a"
                  ),
                })}
              >
                <MenuItem
                  hasSfSymbol
                  leftComponent={<MenuItem.TextIcon icon="􀣔" isLink />}
                  onPress={() => onSelectCloudBackup(mostRecentBackup)}
                  size={52}
                  titleComponent={
                    <MenuItem.Title
                      isLink
                      text={lang.t(lang.l.back_up.cloud.most_recent_backup)}
                    />
                  }
                />
              </Menu>
            )}

            <Menu header={lang.t(lang.l.back_up.cloud.older_backups)}>
              {cloudBackups.map(
                backup =>
                  backup.id !== mostRecentBackup?.id && (
                    <MenuItem
                      key={backup.id}
                      onPress={() => onSelectCloudBackup(backup)}
                      size={52}
                      titleComponent={
                        <MenuItem.Title
                          isLink
                          text={lang.t(
                            lang.l.back_up.cloud.older_backups_title,
                            {
                              date: format(backup.backupDate!, 'M/d/yy'),
                              time: format(backup.backupDate!, 'p'),
                            }
                          )}
                        />
                      }
                    />
                  )
              )}

              {cloudBackups.length === 1 && (
                <MenuItem
                  disabled
                  size={52}
                  titleComponent={
                    <MenuItem.Title
                      disabled
                      text={lang.t(lang.l.back_up.cloud.no_older_backups)}
                    />
                  }
                />
              )}
            </Menu>
          </Stack>
        </Stack>
      </MenuContainer>
    </Box>
  );
}
