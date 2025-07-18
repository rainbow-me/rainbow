import ManuallyBackedUpIcon from '@/assets/ManuallyBackedUp.png';
import { Bleed, Box, Inline, Inset, Separator, Stack, Text } from '@/design-system';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import walletTypes from '@/helpers/walletTypes';
import * as lang from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useSelectedWallet } from '@/state/wallets/walletsStore';
import React, { useCallback } from 'react';
import { Source } from 'react-native-fast-image';
import { ButtonPressAnimation } from '../animations';
import { ImgixImage } from '../images';

const imageSize = 72;

export default function ManualBackupPrompt() {
  const { navigate, goBack } = useNavigation();
  const selectedWallet = useSelectedWallet();

  const onManualBackup = async () => {
    if (!selectedWallet) {
      return;
    }
    const title =
      selectedWallet?.imported && selectedWallet.type === walletTypes.privateKey
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
  };

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
            source={ManuallyBackedUpIcon as Source}
            width={{ custom: imageSize }}
            size={imageSize}
          />
          <Text align="center" size="26pt" weight="bold" color="label">
            {lang.t(lang.l.back_up.manual.backup_manually_now)}
          </Text>
        </Stack>
      </Inset>

      <Bleed horizontal="24px">
        <Separator color="separatorSecondary" thickness={1} />
      </Bleed>

      <ButtonPressAnimation scaleTo={0.95} onPress={onManualBackup}>
        <Box alignItems="center" justifyContent="center" paddingTop={'24px'} paddingBottom={'24px'}>
          <Box alignItems="center" justifyContent="center" width="full">
            <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
              <Text color={'action (Deprecated)'} size="20pt" weight="bold">
                {lang.t(lang.l.back_up.manual.back_up_now)}
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
                {lang.t(lang.l.back_up.manual.already_backed_up)}
              </Text>
            </Inline>
          </Box>
        </Box>
      </ButtonPressAnimation>

      <Bleed horizontal="24px">
        <Separator color="separatorSecondary" thickness={1} />
      </Bleed>
    </Inset>
  );
}
