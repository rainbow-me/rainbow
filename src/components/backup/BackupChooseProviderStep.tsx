import React from 'react';
import { useCreateBackup } from '@/components/backup/useCreateBackup';
import { Bleed, Box, Inline, Inset, Separator, Stack, Text } from '@/design-system';
import * as lang from '@/languages';
import { ImgixImage } from '../images';
import WalletsAndBackupIcon from '@/assets/WalletsAndBackup.png';
import ManuallyBackedUpIcon from '@/assets/ManuallyBackedUp.png';
import Caret from '@/assets/family-dropdown-arrow.png';
import { Source } from 'react-native-fast-image';
import { cloudPlatform } from '@/utils/platform';
import { useTheme } from '@/theme';
import { ButtonPressAnimation } from '../animations';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { SETTINGS_BACKUP_ROUTES } from '@/screens/SettingsSheet/components/Backups/routes';
import { useWallets } from '@/hooks';
import walletTypes from '@/helpers/walletTypes';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { IS_ANDROID } from '@/env';
import { GoogleDriveUserData, getGoogleAccountUserData, isCloudBackupAvailable, login } from '@/handlers/cloudBackup';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { RainbowError, logger } from '@/logger';
import { Linking } from 'react-native';

const imageSize = 72;

export default function BackupSheetSectionNoProvider() {
  const { colors } = useTheme();
  const { navigate, goBack } = useNavigation();
  const { selectedWallet } = useWallets();

  const { onSubmit, loading } = useCreateBackup({
    walletId: selectedWallet.id,
    navigateToRoute: {
      route: Routes.SETTINGS_SHEET,
      params: {
        screen: Routes.SETTINGS_SECTION_BACKUP,
      },
    },
  });

  const onCloudBackup = async () => {
    if (loading !== 'none') {
      return;
    }
    // NOTE: On Android we need to make sure the user is signed into a Google account before trying to backup
    // otherwise we'll fake backup and it's confusing...
    if (IS_ANDROID) {
      try {
        await login();
        getGoogleAccountUserData().then((accountDetails: GoogleDriveUserData | undefined) => {
          if (!accountDetails) {
            Alert.alert(lang.t(lang.l.back_up.errors.no_account_found));
            return;
          }
        });
      } catch (e) {
        Alert.alert(lang.t(lang.l.back_up.errors.no_account_found));
        logger.error(e as RainbowError);
      }
    } else {
      const isAvailable = await isCloudBackupAvailable();
      if (!isAvailable) {
        Alert.alert(
          lang.t(lang.l.modal.back_up.alerts.cloud_not_enabled.label),
          lang.t(lang.l.modal.back_up.alerts.cloud_not_enabled.description),
          [
            {
              onPress: () => {
                Linking.openURL('https://support.apple.com/en-us/HT204025');
              },
              text: lang.t(lang.l.modal.back_up.alerts.cloud_not_enabled.show_me),
            },
            {
              style: 'cancel',
              text: lang.t(lang.l.modal.back_up.alerts.cloud_not_enabled.no_thanks),
            },
          ]
        );
        return;
      }
    }

    onSubmit({});
  };

  const onManualBackup = async () => {
    const title =
      selectedWallet?.imported && selectedWallet.type === walletTypes.privateKey ? selectedWallet.addresses[0].label : selectedWallet.name;

    goBack();
    navigate(Routes.SETTINGS_SHEET, {
      screen: SETTINGS_BACKUP_ROUTES.SECRET_WARNING,
      params: {
        isBackingUp: true,
        title,
        backupType: walletBackupTypes.manual,
        walletId: selectedWallet.id,
      },
    });
  };

  return (
    <Inset horizontal={'24px'} vertical={'44px'}>
      <Inset bottom={'44px'} horizontal={'24px'}>
        <Text align="center" size="26pt" weight="bold" color="label">
          {lang.t(lang.l.back_up.cloud.how_would_you_like_to_backup)}
        </Text>
      </Inset>

      <Bleed horizontal="24px">
        <Separator color="separatorSecondary" thickness={1} />
      </Bleed>

      {/* replace this with BackUpMenuButton */}
      <ButtonPressAnimation scaleTo={0.95} onPress={onCloudBackup}>
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
                        source={WalletsAndBackupIcon as Source}
                        width={{ custom: imageSize }}
                        size={imageSize}
                      />
                      <Text color={'primary (Deprecated)'} size="18px / 27px (Deprecated)" weight="heavy" numberOfLines={1}>
                        {lang.t(lang.l.back_up.cloud.cloud_backup)}
                      </Text>
                      <Text color={'labelSecondary'} size="14px / 19px (Deprecated)" weight="medium">
                        <Text color={'action (Deprecated)'} size="14px / 19px (Deprecated)" weight="bold">
                          {lang.t(lang.l.back_up.cloud.recommended_for_beginners)}
                        </Text>{' '}
                        {lang.t(lang.l.back_up.cloud.choose_backup_cloud_description, {
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
                        {lang.t(lang.l.back_up.cloud.manual_backup)}
                      </Text>
                      <Text color={'labelSecondary'} size="14px / 19px (Deprecated)" weight="medium">
                        {lang.t(lang.l.back_up.cloud.choose_backup_manual_description)}
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
