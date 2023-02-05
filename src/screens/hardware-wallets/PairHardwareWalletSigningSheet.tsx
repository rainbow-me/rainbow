import * as i18n from '@/languages';
import React, { useCallback, useEffect, useReducer } from 'react';
import { Alert, Linking } from 'react-native';
import {
  Box,
  Column,
  Columns,
  Inset,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { Layout } from '@/screens/hardware-wallets/components/Layout';
import { ButtonPressAnimation } from '@/components/animations';
import { TRANSLATIONS } from '@/screens/hardware-wallets/constants';
import { useDimensions, useImportingWallet, useLedgerConnect } from '@/hooks';
import { ActionButton } from '@/screens/hardware-wallets/components/ActionButton';
import { useRecoilValue } from 'recoil';
import { logger } from '@/logger';
import { DebugContext } from '@/logger/debugContext';
import { LedgerImportDeviceIdAtom } from '@/navigation/PairHardwareWalletNavigator';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { LEDGER_ERROR_CODES } from '@/utils/ledger';
import { LEDGER_CONNECTION_STATUS } from '@/hooks/useLedgerConnect';

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

export function PairHardwareWalletSigningSheet() {
  const { isSmallPhone } = useDimensions();
  const { navigate } = useNavigation();
  const deviceId = useRecoilValue(LedgerImportDeviceIdAtom);
  const [readyForPolling, setReadyForPolling] = useReducer(() => true, false);
  const {
    busy,
    handleSetSeedPhrase,
    handlePressImportButton,
  } = useImportingWallet({ showImportModal: true });

  const importHardwareWallet = useCallback(
    async (deviceId: string) => {
      if (busy) {
        logger.debug(
          '[importHardwareWallet] - busy, already trying to import',
          { deviceId },
          DebugContext.ledger
        );
        return;
      }
      logger.debug(
        '[importHardwareWallet] - importing Hardware Wallet',
        { deviceId },
        DebugContext.ledger
      );
      handleSetSeedPhrase(deviceId);
      handlePressImportButton(null, deviceId, null, null);
    },
    [busy, handlePressImportButton, handleSetSeedPhrase]
  );

  const successCallback = useCallback(
    (deviceId: string) => {
      console.log('sucess callback');
      importHardwareWallet(deviceId);
    },
    [importHardwareWallet]
  );

  const errorCallback = useCallback(
    (errorType: LEDGER_ERROR_CODES) => {
      console.log('error callback', errorType);
      if (errorType === LEDGER_ERROR_CODES.NO_ETH_APP) {
        navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
          screen: Routes.PAIR_HARDWARE_WALLET_ETH_APP_ERROR_SHEET,
        });
      } else if (errorType === LEDGER_ERROR_CODES.OFF_OR_LOCKED) {
        navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
          screen: Routes.PAIR_HARDWARE_WALLET_LOCKED_ERROR_SHEET,
        });
      } else {
        console.log('unhandled errorType', errorType);
        Alert.alert('Error', 'Something went wrong. Please try again later.');
      }
    },
    [navigate]
  );

  const { connectionStatus } = useLedgerConnect({
    readyForPolling,
    deviceId,
    successCallback,
    errorCallback,
  });

  const items: ItemDetails[] = [
    {
      title: i18n.t(TRANSLATIONS.blind_signing_instructions.step_1.title),
      description: i18n.t(
        TRANSLATIONS.blind_signing_instructions.step_1.description
      ),
    },
    {
      title: i18n.t(TRANSLATIONS.blind_signing_instructions.step_2.title),
      description: i18n.t(
        TRANSLATIONS.blind_signing_instructions.step_2.description
      ),
    },
    {
      title: i18n.t(TRANSLATIONS.blind_signing_instructions.step_3.title),
      description: i18n.t(
        TRANSLATIONS.blind_signing_instructions.step_3.description
      ),
    },
  ];

  useEffect(() => {
    if (errorCode === LEDGER_ERROR_CODES.NO_ETH_APP) {
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
        screen: Routes.PAIR_HARDWARE_WALLET_ETH_APP_ERROR_SHEET,
      });
    } else if (errorCode === LEDGER_ERROR_CODES.OFF_OR_LOCKED) {
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
        screen: Routes.PAIR_HARDWARE_WALLET_LOCKED_ERROR_SHEET,
      });
    } else if (
      !errorCode &&
      connectionStatus === LEDGER_CONNECTION_STATUS.READY
    ) {
      importHardwareWallet(deviceId);
    }
  }, [connectionStatus, deviceId, errorCode, importHardwareWallet, navigate]);

  return (
    <Layout>
      <Inset horizontal={{ custom: HORIZONTAL_INSET }}>
        <Stack space={isSmallPhone ? '36px' : '80px'}>
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
          <Stack space={isSmallPhone ? '32px' : '44px'}>
            {items.map((item, index) => (
              <Item item={item} rank={index + 1} key={index} />
            ))}
          </Stack>
        </Stack>
      </Inset>
      <ActionButton
        label={i18n.t(TRANSLATIONS.finish_importing)}
        onPress={() => setReadyForPolling()}
      />
    </Layout>
  );
}
