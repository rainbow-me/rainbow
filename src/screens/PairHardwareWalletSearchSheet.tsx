import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Inset, Stack, Text } from '@/design-system';
import { ImgixImage } from '@/components/images';
import ledgerNano from '@/assets/ledger-nano.png';
import { Source } from 'react-native-fast-image';
import { Layout } from '@/components/hardware-wallets/Layout';
import TintButton from '@/components/buttons/TintButton';
import { useNavigation } from '@/navigation';
import { usePairLedgerBluetooth } from '@/hooks/usePairLedgerBluetooth';

export function PairHardwareWalletSearchSheet() {
  const { dangerouslyGetParent } = useNavigation();
  const { device, status } = usePairLedgerBluetooth();

  return (
    <Box background="surfaceSecondary" height="full">
      <Layout
        header={
          <Inset horizontal="44px">
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
            <TintButton
              onPress={() => dangerouslyGetParent()?.goBack()}
              testID="ens-search-clear-button"
            >
              {lang.t('button.cancel')}
            </TintButton>
          </Inset>
        }
      >
        <Inset top="104px">
          <ImgixImage
            source={ledgerNano as Source}
            style={{ width: 216, height: 292 }}
            size={292}
          />
        </Inset>
      </Layout>
    </Box>
  );
}
