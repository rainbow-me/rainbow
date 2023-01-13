import * as i18n from '@/languages';
import React from 'react';
import { Linking } from 'react-native';
import { Inset, Stack, Text, useForegroundColor } from '@/design-system';
import { SheetActionButton } from '@/components/sheet';
import { Layout } from '@/components/hardware-wallets/Layout';
import { useNavigation } from '@/navigation';
import { ButtonPressAnimation } from '@/components/animations';
import { TRANSLATIONS } from '@/navigation/PairHardwareWalletNavigator';

export function PairHardwareWalletSigningSheet() {
  const buttonColor = useForegroundColor('purple');

  const { dangerouslyGetParent } = useNavigation();
  return (
    <Layout
      header={
        <Inset horizontal="36px">
          <Stack alignHorizontal="center" space="20px">
            <Text align="center" color="label" weight="bold" size="26pt">
              {i18n.t(TRANSLATIONS.enable_blind_signing)}
            </Text>
            <Stack space="10px">
              <Text
                align="center"
                color="labelTertiary"
                weight="semibold"
                size="15pt / 135%"
              >
                {i18n.t(TRANSLATIONS.blind_signing_description)}
              </Text>
              <ButtonPressAnimation
                onPress={() =>
                  Linking.openURL(
                    'https://www.ledger.com/academy/enable-blind-signing-why-when-and-how-to-stay-safe'
                  )
                }
                scaleTo={0.9}
              >
                <Text
                  align="center"
                  color="blue"
                  weight="semibold"
                  size="15pt / 135%"
                >
                  {i18n.t(TRANSLATIONS.learn_more)}
                </Text>
              </ButtonPressAnimation>
            </Stack>
          </Stack>
        </Inset>
      }
      footer={
        <Inset horizontal="20px" bottom="20px">
          <SheetActionButton
            color={buttonColor}
            label={i18n.t(TRANSLATIONS.blind_signing_enabled)}
            lightShadows
            onPress={() => dangerouslyGetParent()?.goBack()}
            size="big"
            weight="heavy"
          />
        </Inset>
      }
    />
  );
}
