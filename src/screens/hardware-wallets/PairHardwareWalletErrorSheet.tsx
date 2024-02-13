import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import { Box, Inset, Stack, Text } from '@/design-system';
import { Layout } from '@/screens/hardware-wallets/components/Layout';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useDimensions } from '@/hooks';
import { Source } from 'react-native-fast-image';
import ledgerNanoUnlock from '@/assets/ledger-nano-unlock.png';
import ledgerNanoEthApp from '@/assets/ledger-nano-eth-app.png';
import { ImgixImage } from '@/components/images';
import { TRANSLATIONS } from '@/screens/hardware-wallets/constants';
import { LEDGER_ERROR_CODES } from '@/utils/ledger';
import { useLedgerConnect } from '@/hooks/useLedgerConnect';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

const IMAGE_ASPECT_RATIO = 1.547;
const IMAGE_LEFT_OFFSET = 36;

export type PairHardwareWalletErrorSheetParams = {
  errorType: LEDGER_ERROR_CODES.OFF_OR_LOCKED | LEDGER_ERROR_CODES.NO_ETH_APP;
  deviceId?: string;
};

type RouteParams = {
  PairHardwareWalletErrorSheetParams: PairHardwareWalletErrorSheetParams;
};

export const PairHardwareWalletErrorSheet = () => {
  const route = useRoute<RouteProp<RouteParams, 'PairHardwareWalletErrorSheetParams'>>();
  const { width: deviceWidth } = useDimensions();
  const { goBack, navigate } = useNavigation();

  const imageWidth = deviceWidth - IMAGE_LEFT_OFFSET;
  const imageHeight = imageWidth / IMAGE_ASPECT_RATIO;

  const errorType = route?.params?.errorType;

  const errorCallback = useCallback(
    (errorType: LEDGER_ERROR_CODES) => {
      if (errorType === LEDGER_ERROR_CODES.NO_ETH_APP || errorType === LEDGER_ERROR_CODES.OFF_OR_LOCKED) {
        navigate(Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET, {
          errorType,
          deviceId: route?.params?.deviceId,
        });
      } else {
        // silent for now
      }
    },
    [navigate, route?.params?.deviceId]
  );

  useLedgerConnect({
    readyForPolling: !!route?.params?.deviceId,
    deviceId: route?.params?.deviceId || '',
    successCallback: () => {
      goBack();
    },
    errorCallback,
  });

  return (
    <Layout>
      <Inset horizontal="36px">
        <Stack alignHorizontal="center" space="20px">
          <Text align="center" color="label" weight="bold" size="26pt">
            {i18n.t(TRANSLATIONS[errorType === 'no_eth_app' ? 'open_eth_app' : 'unlock_ledger'])}
          </Text>
          <Stack space="10px">
            <Text align="center" color="labelTertiary" weight="semibold" size="15pt / 135%">
              {i18n.t(TRANSLATIONS.open_eth_app_description)}
            </Text>
          </Stack>
        </Stack>
      </Inset>
      <Box position="absolute" top={{ custom: 148 }}>
        <ImgixImage
          source={(errorType === LEDGER_ERROR_CODES.NO_ETH_APP ? ledgerNanoEthApp : ledgerNanoUnlock) as Source}
          style={{
            width: imageWidth,
            height: imageHeight,
            marginLeft: IMAGE_LEFT_OFFSET,
          }}
          size={imageHeight}
        />
        <Box paddingHorizontal="36px" top={{ custom: -35 }}>
          <Text align="center" color="labelTertiary" weight="semibold" size="15pt / 135%">
            {i18n.t(TRANSLATIONS.enter_passcode)}
          </Text>
        </Box>
      </Box>
    </Layout>
  );
};
