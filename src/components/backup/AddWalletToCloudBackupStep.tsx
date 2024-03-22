import React, { useCallback } from 'react';
import { Bleed, Box, Inline, Inset, Separator, Stack, Text } from '@/design-system';
import * as lang from '@/languages';
import { ImgixImage } from '../images';
import WalletsAndBackupIcon from '@/assets/WalletsAndBackup.png';
import { Source } from 'react-native-fast-image';
import { cloudPlatform } from '@/utils/platform';
import { ButtonPressAnimation } from '../animations';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import { useWallets } from '@/hooks';
import { WalletCountPerType, useVisibleWallets } from '@/screens/SettingsSheet/useVisibleWallets';
import { format } from 'date-fns';
import { useCreateBackup } from './useCreateBackup';
import { login } from '@/handlers/cloudBackup';

const imageSize = 72;

export default function AddWalletToCloudBackupStep() {
  const { goBack } = useNavigation();
  const { wallets, selectedWallet } = useWallets();

  const walletTypeCount: WalletCountPerType = {
    phrase: 0,
    privateKey: 0,
  };

  const { lastBackupDate } = useVisibleWallets({ wallets, walletTypeCount });

  const { onSubmit } = useCreateBackup({
    walletId: selectedWallet.id,
    navigateToRoute: {
      route: Routes.SETTINGS_SHEET,
      params: {
        screen: Routes.SETTINGS_SECTION_BACKUP,
      },
    },
  });

  const potentiallyLoginAndSubmit = useCallback(async () => {
    await login();
    return onSubmit({});
  }, [onSubmit]);

  const onMaybeLater = useCallback(() => goBack(), [goBack]);

  return (
    <Inset horizontal={'24px'} vertical={'44px'}>
      <Inset bottom={'44px'} horizontal={'24px'}>
        <Stack alignHorizontal="center">
          <Box
            as={ImgixImage}
            borderRadius={imageSize / 2}
            height={{ custom: imageSize }}
            marginLeft={{ custom: -12 }}
            marginRight={{ custom: -12 }}
            marginTop={{ custom: 0 }}
            marginBottom={{ custom: 8 }}
            source={WalletsAndBackupIcon as Source}
            width={{ custom: imageSize }}
            size={imageSize}
          />
          <Text align="center" size="26pt" weight="bold" color="label">
            {lang.t(lang.l.back_up.cloud.add_wallet_to_cloud_backups)}
          </Text>
        </Stack>
      </Inset>

      <Bleed horizontal="24px">
        <Separator color="separatorSecondary" thickness={1} />
      </Bleed>

      <ButtonPressAnimation scaleTo={0.95} onPress={() => potentiallyLoginAndSubmit().then(success => success && goBack())}>
        <Box alignItems="center" justifyContent="center" paddingTop={'24px'} paddingBottom={'24px'}>
          <Box alignItems="center" justifyContent="center" width="full">
            <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
              <Text color={'action (Deprecated)'} size="20pt" weight="bold">
                􀎽{' '}
                {lang.t(lang.l.back_up.cloud.back_to_cloud_platform_now, {
                  cloudPlatform,
                })}
              </Text>
            </Inline>
          </Box>
        </Box>
      </ButtonPressAnimation>

      <Bleed horizontal="24px">
        <Separator color="separatorSecondary" thickness={1} />
      </Bleed>

      <ButtonPressAnimation scaleTo={0.95} onPress={onMaybeLater}>
        <Box alignItems="center" justifyContent="center" paddingTop={'24px'} paddingBottom={'24px'}>
          <Box alignItems="center" justifyContent="center" width="full">
            <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
              <Text color={'labelSecondary'} size="20pt" weight="bold">
                {lang.t(lang.l.back_up.cloud.mayber_later)}
              </Text>
            </Inline>
          </Box>
        </Box>
      </ButtonPressAnimation>

      <Bleed horizontal="24px">
        <Separator color="separatorSecondary" thickness={1} />
      </Bleed>

      {lastBackupDate && (
        <Box alignItems="center" justifyContent="center" paddingTop={'24px'} paddingBottom={'24px'}>
          <Box alignItems="center" justifyContent="center" width="full">
            <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
              <Text color={'labelTertiary'} size="15pt" weight="medium">
                {lang.t(lang.l.back_up.cloud.latest_backup, {
                  date: format(lastBackupDate, "M/d/yy 'at' h:mm a"),
                })}
              </Text>
            </Inline>
          </Box>
        </Box>
      )}
    </Inset>
  );
}
