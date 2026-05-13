import React, { useCallback, useMemo } from 'react';

import { type Source } from 'react-native-fast-image';

import Caret from '@/assets/family-dropdown-arrow.png';
import ManuallyBackedUpIcon from '@/assets/ManuallyBackedUp.png';
import WalletsAndBackupIcon from '@/assets/WalletsAndBackup.png';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import { Bleed, Box, Inline, Inset, Separator, Stack, Text } from '@/design-system';
import { type TextColor } from '@/design-system/color/palettes';
import { type CustomColor } from '@/design-system/color/useForegroundColor';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import WalletTypes from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useSelectedWallet } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme/ThemeContext';
import { cloudPlatform } from '@/utils/platform';

import { executeFnIfCloudBackupAvailable } from '../backup';
import { useCreateBackup } from '../hooks/useCreateBackup';
import { backupsStore, CloudBackupState } from '../stores/backupsStore';

const imageSize = 72;

export default function BackupSheetSectionNoProvider() {
  const { navigate, goBack } = useNavigation();
  const selectedWallet = useSelectedWallet();
  const createBackup = useCreateBackup();
  const status = backupsStore(state => state.status);

  const onCloudBackup = useCallback(() => {
    if (!selectedWallet) return;

    // pop the bottom sheet, and navigate to the backup section inside settings sheet
    goBack();
    navigate(Routes.SETTINGS_SHEET, {
      screen: Routes.SETTINGS_SECTION_BACKUP,
      initial: false,
    });

    executeFnIfCloudBackupAvailable({
      fn: () =>
        createBackup({
          walletId: selectedWallet.id,
        }),
      logout: true,
    });
  }, [createBackup, goBack, navigate, selectedWallet]);

  const onManualBackup = useCallback(async () => {
    if (!selectedWallet) return;

    const title =
      selectedWallet?.imported && selectedWallet.type === WalletTypes.privateKey
        ? (selectedWallet.addresses || [])[0].label
        : selectedWallet.name;

    goBack();
    navigate(Routes.SETTINGS_SHEET, {
      screen: Routes.SECRET_WARNING,
      params: {
        isBackingUp: true,
        title,
        backupType: walletBackupTypes.manual,
        walletId: selectedWallet.id,
      },
    });
  }, [goBack, navigate, selectedWallet]);

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

      <BackupOptionRow
        icon={WalletsAndBackupIcon}
        header={text}
        headerColor={color}
        onPress={onCloudBackup}
        disabled={isCloudBackupDisabled}
      >
        <Text color={'action (Deprecated)'} size="14px / 19px (Deprecated)" weight="bold">
          {i18n.t(i18n.l.back_up.cloud.recommended_for_beginners)}
        </Text>{' '}
        {i18n.t(i18n.l.back_up.cloud.choose_backup_cloud_description, {
          cloudPlatform,
        })}
      </BackupOptionRow>

      <Bleed horizontal="24px">
        <Separator color="separatorSecondary" thickness={1} />
      </Bleed>

      <BackupOptionRow icon={ManuallyBackedUpIcon} header={i18n.t(i18n.l.back_up.cloud.manual_backup)} onPress={onManualBackup}>
        {i18n.t(i18n.l.back_up.cloud.choose_backup_manual_description)}
      </BackupOptionRow>
    </Inset>
  );
}

type BackupOptionRowProps = {
  icon: Source | number;
  header: string;
  onPress: () => void;
  headerColor?: TextColor | CustomColor;
  disabled?: boolean;
  children: React.ReactNode;
};
function BackupOptionRow({
  icon,
  header,
  headerColor = 'primary (Deprecated)',
  onPress,
  disabled = false,
  children,
}: BackupOptionRowProps) {
  const { colors } = useTheme();

  return (
    <ButtonPressAnimation disabled={disabled} scaleTo={0.95} onPress={onPress}>
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
                      source={icon}
                      width={{ custom: imageSize }}
                      size={imageSize}
                    />
                    <Text color={headerColor} size="18px / 27px (Deprecated)" weight="heavy" numberOfLines={1}>
                      {header}
                    </Text>
                    <Text color={'labelSecondary'} size="14px / 19px (Deprecated)" weight="medium">
                      {children}
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
  );
}
