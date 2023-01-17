import lang from 'i18n-js';
import React from 'react';
import { Inset, Stack, Text } from '@/design-system';
import { Layout } from '@/components/hardware-wallets/Layout';
import TintButton from '@/components/buttons/TintButton';
import { useNavigation } from '@/navigation';

export function PairHardwareWalletSearchSheet() {
  const { dangerouslyGetParent } = useNavigation();

  return (
    <Layout
      header={
        <Inset horizontal="36px">
          <Stack alignHorizontal="center" space="20px">
            <Text align="center" color="label" weight="bold" size="26pt">
              {lang.t('hardware_wallets.looking_for_devices')}
            </Text>
            <Text
              align="center"
              color="labelTertiary"
              weight="semibold"
              size="15pt / 135%"
            >
              {lang.t('hardware_wallets.make_sure_bluetooth_enabled')}
            </Text>
          </Stack>
        </Inset>
      }
      footer={
        <Inset horizontal="20px">
          <TintButton onPress={() => dangerouslyGetParent()?.goBack()}>
            {lang.t('button.cancel')}
          </TintButton>
        </Inset>
      }
    />
  );
}
