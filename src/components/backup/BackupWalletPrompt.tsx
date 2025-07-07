import ManuallyBackedUpIcon from '@/assets/ManuallyBackedUp.png';
import WalletsAndBackupIcon from '@/assets/WalletsAndBackup.png';
import Caret from '@/assets/family-dropdown-arrow.png';
import { useCreateBackup } from '@/components/backup/useCreateBackup';
import { Bleed, Box, Inline, Inset, Separator, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { executeFnIfCloudBackupAvailable } from '@/model/backup';
import Routes from '@/navigation/routesNames';
import { backupsStore, CloudBackupState } from '@/state/backups/backups';
import { useSelectedWallet } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import { cloudPlatform } from '@/utils/platform';
import React, { useCallback, useMemo } from 'react';
import { Source } from 'react-native-fast-image';
import { ButtonPressAnimation } from '../animations';
import { ImgixImage } from '../images';
import { Navigation } from '@/navigation';

const imageSize = 72;

export default function BackupSheetSectionNoProvider() {
  const { colors } = useTheme();
  const selectedWallet = useSelectedWallet();
  const createBackup = useCreateBackup();
  const status = backupsStore(state => state.status);

  const onCloudBackup = useCallback(() => {
    if (!selectedWallet) return;

    // pop the bottom sheet, and navigate to the backup section inside settings sheet
    Navigation.goBack();
    Navigation.handleAction(Routes.SETTINGS_SHEET, {
      screen: Routes.SETTINGS_SECTION_BACKUP,
    });

    executeFnIfCloudBackupAvailable({
      fn: () =>
        createBackup({
          walletId: selectedWallet.id,
        }),
      logout: true,
    });
  }, [createBackup, selectedWallet]);

  const onManualBackup = useCallback(async () => {
    if (!selectedWallet) return;

    const title =
      selectedWallet?.imported && selectedWallet.type === WalletTypes.privateKey
        ? (selectedWallet.addresses || [])[0].label
        : selectedWallet.name;

    Navigation.goBack();
    Navigation.handleAction(Routes.SETTINGS_SHEET, {
      screen: Routes.SECRET_WARNING,
      params: {
        isBackingUp: true,
        title,
        backupType: walletBackupTypes.manual,
        walletId: selectedWallet.id,
      },
    });
  }, [selectedWallet]);

  const isCloudBackupDisabled = useMemo(() => {
    return status !== CloudBackupState.Ready && status !== CloudBackupState.NotAvailable;
  }, [status]);

  const { color, text } = useMemo<{ text: string; color: TextColor | CustomColor }>(() => {
    if (status === CloudBackupState.FailedToInitialize || status === CloudBackupState.NotAvailable) {
      return {
        text: i18n.t(i18n.l.back_up.cloud.statuses.not_enabled),
        color: 'primary (Deprecated)',
      };
    }

    if (status === CloudBackupState.Ready) {
      return {
        text: i18n.t(i18n.l.back_up.cloud.cloud_backup),
        color: 'primary (Deprecated)',
      };
    }

    return {
      text: i18n.t(i18n.l.back_up.cloud.statuses.syncing),
      color: 'yellow',
    };
  }, [status]);

  return (
    <Inset horizontal={'24px'} vertical={'44px'} testId={'backup-reminder-sheet'}>
      <Inset bottom={'44px'} horizontal={'24px'}>
        <Text align="center" size="26pt" weight="bold" color="label">
          {i18n.t(i18n.l.back_up.cloud.how_would_you_like_to_backup)}
        </Text>
      </Inset>

      <Bleed horizontal="24px">
        <Separator color="separatorSecondary" thickness={1} />
      </Bleed>

      <ButtonPressAnimation disabled={isCloudBackupDisabled} scaleTo={0.95} onPress={onCloudBackup}>
        <Box alignItems="flex-start" justifyContent="flex-start" paddingTop={'24px'} paddingBottom={'36px'} gap={8}>
          <Box justifyContent="center" width="full">
            <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
              <Box flexShrink={1}>
                <Inline alignVertical="center" wrap={false}>
                  <Box flexShrink={1}>
                    <Stack width="full" space="12px">
                      <Box
                        as={ImgixImage}
                        borderRadius={imageSize / 2}
                        height={{ custom: imageSize }}
                        marginLeft={{ custom: -12 }}
                        marginRight={{ custom: -12 }}
                        marginTop={{ custom: 0 }}
                        marginBottom={{ custom: -8 }}
                        source={WalletsAndBackupIcon}
                        width={{ custom: imageSize }}
                        size={imageSize}
                      />
                      <Text color={color} size="18px / 27px (Deprecated)" weight="heavy" numberOfLines={1}>
                        {text}
                      </Text>
                      <Text color={'labelSecondary'} size="14px / 19px (Deprecated)" weight="medium">
                        <Text color={'action (Deprecated)'} size="14px / 19px (Deprecated)" weight="bold">
                          {i18n.t(i18n.l.back_up.cloud.recommended_for_beginners)}
                        </Text>{' '}
                        {i18n.t(i18n.l.back_up.cloud.choose_backup_cloud_description, {
                          cloudPlatform,
                        })}
                      </Text>
                    </Stack>
                  </Box>
                </Inline>
              </Box>
              <Box paddingLeft="8px">
                <Box
                  as={ImgixImage}
                  height={{ custom: 16 }}
                  source={Caret as Source}
                  tintColor={colors.dark}
                  width={{ custom: 7 }}
                  size={30}
                />
              </Box>
            </Inline>
          </Box>
        </Box>
      </ButtonPressAnimation>

      <Bleed horizontal="24px">
        <Separator color="separatorSecondary" thickness={1} />
      </Bleed>

      <ButtonPressAnimation scaleTo={0.95} onPress={onManualBackup}>
        <Box alignItems="flex-start" justifyContent="flex-start" paddingTop={'24px'} gap={8}>
          <Box justifyContent="center" width="full">
            <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
              <Box flexShrink={1}>
                <Inline alignVertical="center" wrap={false}>
                  <Box flexShrink={1}>
                    <Stack width="full" space="12px">
                      <Box
                        as={ImgixImage}
                        borderRadius={imageSize / 2}
                        height={{ custom: imageSize }}
                        marginLeft={{ custom: -12 }}
                        marginRight={{ custom: -12 }}
                        marginTop={{ custom: 0 }}
                        marginBottom={{ custom: -8 }}
                        source={ManuallyBackedUpIcon as Source}
                        width={{ custom: imageSize }}
                        size={imageSize}
                      />
                      <Text color={'primary (Deprecated)'} size="18px / 27px (Deprecated)" weight="heavy" numberOfLines={1}>
                        {i18n.t(i18n.l.back_up.cloud.manual_backup)}
                      </Text>
                      <Text color={'labelSecondary'} size="14px / 19px (Deprecated)" weight="medium">
                        {i18n.t(i18n.l.back_up.cloud.choose_backup_manual_description)}
                      </Text>
                    </Stack>
                  </Box>
                </Inline>
              </Box>
              <Box paddingLeft="8px">
                <Box
                  as={ImgixImage}
                  height={{ custom: 16 }}
                  source={Caret as Source}
                  tintColor={colors.dark}
                  width={{ custom: 7 }}
                  size={30}
                />
              </Box>
            </Inline>
          </Box>
        </Box>
      </ButtonPressAnimation>
    </Inset>
  );
}
