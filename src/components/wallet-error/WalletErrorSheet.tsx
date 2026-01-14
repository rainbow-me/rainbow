import restoreWalletIcon from '@/assets/restoreWalletIcon.png';
import { ButtonPressAnimation } from '@/components/animations';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { BackgroundProvider, Box, Separator, Text } from '@/design-system';
import { IS_IOS } from '@/env';
import { useBiometryType } from '@/hooks';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';
import React from 'react';
import { InteractionManager } from 'react-native';
import FastImage from 'react-native-fast-image';

export function getWalletErrorSheetHeight() {
  return 370 + safeAreaInsetValues.bottom;
}

export default function WalletErrorSheet() {
  const navigation = useNavigation();
  const biometryType = useBiometryType();
  const { cause, resolution } = (() => {
    if (IS_IOS) {
      if (biometryType === 'none') {
        return { cause: 'passcode_disabled', resolution: 'enable_passcode' } as const;
      } else {
        return { cause: 'device_changed', resolution: 'reimport' } as const;
      }
    } else {
      return { cause: 'passcode_disabled', resolution: 'reimport' } as const;
    }
  })();
  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          testID="wallet-error-sheet"
          backgroundColor={backgroundColor as string}
          customHeight={getWalletErrorSheetHeight()}
          useAdditionalTopPadding
          scrollEnabled={false}
        >
          <Box alignItems="center" paddingTop="36px" paddingHorizontal={{ custom: 40 }} gap={16} marginBottom={{ custom: 40 }}>
            <FastImage source={restoreWalletIcon} style={{ width: 40, height: 48 }} />
            <Text size="26pt" weight="bold" color="label" align="center">
              {i18n.t(i18n.l.wallet_error_sheet.title)}
            </Text>
            <Text size="15pt / 135%" weight="semibold" color="labelTertiary" align="center">
              {cause === 'passcode_disabled'
                ? i18n.t(i18n.l.wallet_error_sheet.cause_passcode_disabled)
                : i18n.t(i18n.l.wallet_error_sheet.cause_switched_devices)}{' '}
              {resolution === 'enable_passcode'
                ? i18n.t(i18n.l.wallet_error_sheet.resolution_enable_passcode)
                : i18n.t(i18n.l.wallet_error_sheet.resolution_restore_backup)}
            </Text>
          </Box>
          {resolution === 'reimport' && (
            <>
              <Separator thickness={1} color="separator" />
              <ButtonPressAnimation
                style={{ padding: 21 }}
                onPress={() => {
                  navigation.goBack();
                  InteractionManager.runAfterInteractions(() => {
                    navigation.navigate(Routes.ADD_WALLET_NAVIGATOR, {
                      isFirstWallet: true,
                    });
                  });
                }}
              >
                <Text size="20pt" color="blue" weight="bold" align="center">
                  {i18n.t(i18n.l.wallet_error_sheet.restore)}
                </Text>
              </ButtonPressAnimation>
            </>
          )}
          <Separator thickness={1} color="separator" />
          <ButtonPressAnimation
            style={{ padding: 21 }}
            onPress={() => {
              navigation.goBack();
            }}
          >
            <Text size="20pt" color="labelSecondary" weight="bold" align="center">
              {i18n.t(i18n.l.wallet_error_sheet.dismiss)}
            </Text>
          </ButtonPressAnimation>
          <Separator thickness={1} color="separator" />
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
