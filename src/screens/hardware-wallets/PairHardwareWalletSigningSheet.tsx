import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { Box, Column, Columns, Inset, Stack, Text, useForegroundColor } from '@/design-system';
import { Layout } from '@/screens/hardware-wallets/components/Layout';
import { ButtonPressAnimation } from '@/components/animations';
import { TRANSLATIONS } from '@/screens/hardware-wallets/constants';
import { useDimensions, useImportingWallet } from '@/hooks';
import { ActionButton } from '@/screens/hardware-wallets/components/ActionButton';
import { useRecoilValue } from 'recoil';
import { RainbowError, logger } from '@/logger';
import { DebugContext } from '@/logger/debugContext';
import { LedgerImportDeviceIdAtom } from '@/navigation/PairHardwareWalletNavigator';
import { checkLedgerConnection, LEDGER_ERROR_CODES } from '@/utils/ledger';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { RouteProp, useRoute } from '@react-navigation/native';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';

const NUMBER_BOX_SIZE = 28;
const HORIZONTAL_INSET = 36;
const COLUMNS_PADDING = 20;

const NumberBox = ({ number }: { number: number }) => {
  const itemBorderColor = useForegroundColor('buttonStrokeSecondary');
  return (
    <Box
      width={{ custom: NUMBER_BOX_SIZE }}
      height={{ custom: NUMBER_BOX_SIZE }}
      alignItems="center"
      justifyContent="center"
      background="surfaceSecondaryElevated"
      shadow="24px"
      borderRadius={8}
      style={{ borderWidth: 1, borderColor: itemBorderColor }}
    >
      <Text align="center" color="label" size="17pt" weight="bold">
        {number}
      </Text>
    </Box>
  );
};

type ItemDetails = {
  title: string;
  description: string;
};

type ItemProps = {
  item: ItemDetails;
  rank: number;
};

const Item = ({ item, rank }: ItemProps) => {
  const { width: deviceWidth } = useDimensions();
  return (
    <Columns space={{ custom: COLUMNS_PADDING }}>
      <Column width="content">
        <NumberBox number={rank} />
      </Column>
      <Column
        // sorry for this hack, but it's seemingly the only way to make the
        // text wrap properly while being confined to the horizontal inset
        width={{ custom: deviceWidth - 2 * HORIZONTAL_INSET - COLUMNS_PADDING }}
      >
        <Stack space="12px">
          <Text weight="heavy" size="17pt" color="label">
            {item.title}
          </Text>
          <Text weight="medium" size="15pt / 135%" color="labelSecondary">
            {item.description}
          </Text>
        </Stack>
      </Column>
    </Columns>
  );
};

export type PairHardwareWalletSigningSheetParams = {
  shouldGoBack: boolean;
};

type RouteParams = {
  PairHardwareWalletSigningSheetParams: PairHardwareWalletSigningSheetParams;
};

export function PairHardwareWalletSigningSheet() {
  const route = useRoute<RouteProp<RouteParams, 'PairHardwareWalletSigningSheetParams'>>();
  const { navigate, goBack } = useNavigation();
  const { isSmallPhone } = useDimensions();
  const deviceId = useRecoilValue(LedgerImportDeviceIdAtom);
  const { busy, handleSetSeedPhrase, handlePressImportButton } = useImportingWallet({ showImportModal: true });

  const items: ItemDetails[] = [
    {
      title: i18n.t(TRANSLATIONS.blind_signing_instructions.step_1.title),
      description: i18n.t(TRANSLATIONS.blind_signing_instructions.step_1.description),
    },
    {
      title: i18n.t(TRANSLATIONS.blind_signing_instructions.step_2.title),
      description: i18n.t(TRANSLATIONS.blind_signing_instructions.step_2.description),
    },
    {
      title: i18n.t(TRANSLATIONS.blind_signing_instructions.step_3.title),
      description: i18n.t(TRANSLATIONS.blind_signing_instructions.step_3.description),
    },
  ];

  const importHardwareWallet = useCallback(
    async (deviceId: string) => {
      if (busy) {
        logger.debug('[importHardwareWallet] - busy, already trying to import', { deviceId }, DebugContext.ledger);
        return;
      }
      logger.debug('[importHardwareWallet] - importing Hardware Wallet', { deviceId }, DebugContext.ledger);
      handleSetSeedPhrase(deviceId);
      handlePressImportButton(null, deviceId, null, null);
    },
    [busy, handlePressImportButton, handleSetSeedPhrase]
  );

  const successCallback = useCallback(
    (deviceId: string) => {
      importHardwareWallet(deviceId);
    },
    [importHardwareWallet]
  );

  const errorCallback = useCallback(
    async (errorType: LEDGER_ERROR_CODES) => {
      if (errorType === LEDGER_ERROR_CODES.NO_ETH_APP || errorType === LEDGER_ERROR_CODES.OFF_OR_LOCKED) {
        navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
          screen: Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET,
          params: {
            errorType,
            deviceId,
          },
        });
      } else {
        logger.error(new RainbowError('[importHardwareWallet] - Disconnected or Unkown Error'), { errorType });
        logger.info('[importHardwareWallet] - issue connecting, trying again ');
        const transport = await TransportBLE.open(deviceId);
        await checkLedgerConnection({
          transport,
          deviceId,
          successCallback,
          errorCallback: () => {
            Alert.alert(i18n.t(TRANSLATIONS.pairing_error_alert.title), i18n.t(TRANSLATIONS.pairing_error_alert.body));
          },
        });
      }
    },
    [deviceId, navigate, successCallback]
  );

  const handleButtonPress = useCallback(async (): Promise<void> => {
    const transport = await TransportBLE.open(deviceId);
    await checkLedgerConnection({
      transport,
      deviceId,
      successCallback,
      errorCallback,
    });
  }, [deviceId, successCallback, errorCallback]);

  return (
    <Layout>
      <Inset horizontal={{ custom: HORIZONTAL_INSET }}>
        <Stack space={isSmallPhone ? '36px' : '80px'}>
          <Stack alignHorizontal="center" space="20px">
            <Text align="center" color="label" weight="bold" size="26pt">
              {i18n.t(TRANSLATIONS.enable_blind_signing)}
            </Text>
            <Stack space="10px">
              <Text align="center" color="labelTertiary" weight="semibold" size="15pt / 135%">
                {i18n.t(TRANSLATIONS.blind_signing_description)}
              </Text>
              <ButtonPressAnimation
                onPress={() => Linking.openURL('https://www.ledger.com/academy/enable-blind-signing-why-when-and-how-to-stay-safe')}
                scaleTo={0.9}
              >
                <Text align="center" color="blue" weight="semibold" size="15pt / 135%">
                  {i18n.t(TRANSLATIONS.learn_more)}
                </Text>
              </ButtonPressAnimation>
            </Stack>
          </Stack>
          <Stack space={isSmallPhone ? '32px' : '44px'}>
            {items.map((item, index) => (
              <Item item={item} rank={index + 1} key={index} />
            ))}
          </Stack>
        </Stack>
      </Inset>
      <ActionButton
        label={route?.params?.shouldGoBack ? i18n.t(TRANSLATIONS.blind_signing_enabled) : i18n.t(TRANSLATIONS.finish_importing)}
        onPress={() => (route?.params?.shouldGoBack ? goBack() : handleButtonPress())}
      />
    </Layout>
  );
}
