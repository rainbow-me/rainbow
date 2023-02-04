import * as i18n from '@/languages';
import React from 'react';
import { Box, Inset, Stack, Text } from '@/design-system';
import { CancelButton } from '@/screens/hardware-wallets/components/CancelButton';
import { Layout } from '@/screens/hardware-wallets/components/Layout';
import { RouteProp, useRoute } from '@react-navigation/core';
import { useDimensions } from '@/hooks';
import { Source } from 'react-native-fast-image';
import ledgerNanoUnlock from '@/assets/ledger-nano-unlock.png';
import ledgerNanoEthApp from '@/assets/ledger-nano-eth-app.png';
import { ImgixImage } from '@/components/images';
import { TRANSLATIONS } from '@/screens/hardware-wallets/constants';

const IMAGE_ASPECT_RATIO = 1.547;
const IMAGE_LEFT_OFFSET = 36;

export type PairHardwareWalletErrorSheetParams = {
  errorType: 'off_or_locked' | 'no_eth_app';
};

type RouteParams = {
  PairHardwareWalletErrorSheetParams: PairHardwareWalletErrorSheetParams;
};

export const PairHardwareWalletErrorSheet = () => {
  const route = useRoute<
    RouteProp<RouteParams, 'PairHardwareWalletErrorSheetParams'>
  >();
  const { width: deviceWidth } = useDimensions();

  const imageWidth = deviceWidth - IMAGE_LEFT_OFFSET;
  const imageHeight = imageWidth / IMAGE_ASPECT_RATIO;

  const errorType = route?.params?.errorType;

  return (
    <Layout>
      <Inset horizontal="36px">
        <Stack alignHorizontal="center" space="20px">
          <Text align="center" color="label" weight="bold" size="26pt">
            {i18n.t(
              TRANSLATIONS[
                errorType === 'no_eth_app' ? 'open_eth_app' : 'unlock_ledger'
              ]
            )}
          </Text>
          <Stack space="10px">
            <Text
              align="center"
              color="labelTertiary"
              weight="semibold"
              size="15pt / 135%"
            >
              {i18n.t(TRANSLATIONS.open_eth_app_description)}
            </Text>
          </Stack>
        </Stack>
      </Inset>
      <Box marginTop="-44px">
        <ImgixImage
          source={
            (errorType === 'no_eth_app'
              ? ledgerNanoEthApp
              : ledgerNanoUnlock) as Source
          }
          style={{
            width: imageWidth,
            height: imageHeight,
            marginLeft: IMAGE_LEFT_OFFSET,
          }}
          size={imageHeight}
        />
        <Box paddingHorizontal="36px" top={{ custom: -35 }}>
          <Text
            align="center"
            color="labelTertiary"
            weight="semibold"
            size="15pt / 135%"
          >
            {i18n.t(TRANSLATIONS.enter_passcode)}
          </Text>
        </Box>
      </Box>
      <CancelButton />
    </Layout>
  );
};
