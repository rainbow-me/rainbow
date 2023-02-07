import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import { Box, Inset, Stack, Text } from '@/design-system';
import { Layout } from '@/screens/hardware-wallets/components/Layout';
import { useDimensions, useLedgerConnect } from '@/hooks';
import { Source } from 'react-native-fast-image';
import ledgerNanoUnlock from '@/assets/ledger-nano-unlock.png';
import ledgerNanoEthApp from '@/assets/ledger-nano-eth-app.png';
import { ImgixImage } from '@/components/images';
import { TRANSLATIONS } from '@/screens/hardware-wallets/constants';
import { LEDGER_ERROR_CODES } from '@/utils/ledger';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Alert } from 'react-native';

const IMAGE_ASPECT_RATIO = 1.547;
const IMAGE_LEFT_OFFSET = 36;

type ErrorSheetProps = {
  deviceId?: string;
};

export type ErrorSheetRouteParams = {
  ErrorSheetProps: ErrorSheetProps;
};

export const ErrorSheet = ({
  deviceId,
  type,
}: {
  deviceId?: string;
  type: LEDGER_ERROR_CODES.OFF_OR_LOCKED | LEDGER_ERROR_CODES.NO_ETH_APP;
}) => {
  const { dangerouslyGetParent, navigate } = useNavigation();
  const { width: deviceWidth } = useDimensions();

  const imageWidth = deviceWidth - IMAGE_LEFT_OFFSET;
  const imageHeight = imageWidth / IMAGE_ASPECT_RATIO;

  const successCallback = useCallback(() => {
    dangerouslyGetParent()?.goBack(); // to blind signing sheet
    // or nav to tx details (?) if confirming a tx
  }, [dangerouslyGetParent]);

  const errorCallback = useCallback(
    (errorType: LEDGER_ERROR_CODES) => {
      console.log('error callback', errorType);
      if (errorType === LEDGER_ERROR_CODES.OFF_OR_LOCKED) {
        if (type === LEDGER_ERROR_CODES.NO_ETH_APP) {
          navigate(Routes.PAIR_HARDWARE_WALLET_LOCKED_ERROR_SHEET, {
            params: deviceId,
          });
        }
      } else if (errorType === LEDGER_ERROR_CODES.NO_ETH_APP) {
        if (type === LEDGER_ERROR_CODES.OFF_OR_LOCKED) {
          navigate(Routes.PAIR_HARDWARE_WALLET_ETH_APP_ERROR_SHEET, {
            params: deviceId,
          });
        }
      } else {
        console.log('unhandled errorType', errorType);
        Alert.alert('Error', 'Something went wrong. Please try again later.');
      }
    },
    [navigate, type]
  );

  useLedgerConnect({
    readyForPolling: !!deviceId,
    deviceId: deviceId || '',
    successCallback: successCallback,
    errorCallback,
  });

  return (
    <Layout>
      <Inset horizontal="36px">
        <Stack alignHorizontal="center" space="20px">
          <Text align="center" color="label" weight="bold" size="26pt">
            {i18n.t(
              TRANSLATIONS[
                type === LEDGER_ERROR_CODES.NO_ETH_APP
                  ? 'open_eth_app'
                  : 'unlock_ledger'
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
      <Box position="absolute" top={{ custom: 122 }}>
        <ImgixImage
          source={
            (type === LEDGER_ERROR_CODES.NO_ETH_APP
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
    </Layout>
  );
};
