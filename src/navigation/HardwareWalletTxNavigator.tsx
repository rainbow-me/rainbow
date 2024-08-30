import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useCallback, useEffect } from 'react';
import Routes from '@/navigation/routesNames';
import { BackgroundProvider } from '@/design-system';
import { useDimensions, useWallets } from '@/hooks';
import { PairHardwareWalletAgainSheet } from '@/screens/hardware-wallets/PairHardwareWalletAgainSheet';
import { PairHardwareWalletErrorSheet } from '@/screens/hardware-wallets/PairHardwareWalletErrorSheet';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { useLedgerConnect } from '@/hooks/useLedgerConnect';
import { LEDGER_ERROR_CODES } from '@/utils/ledger';
import { useNavigation } from '@/navigation';
import { logger } from '@/logger';
import { DebugContext } from '@/logger/debugContext';
// eslint-disable-next-line no-restricted-imports
import { RouteProp, useRoute } from '@react-navigation/native';
import { atom, useRecoilState } from 'recoil';
import { MMKV } from 'react-native-mmkv';

export const ledgerStorage = new MMKV({
  id: 'ledgerStorage',
});

export const HARDWARE_TX_ERROR_KEY = 'hardwareTXError';

export const setHardwareTXError = (value: boolean) => {
  logger.info(`setHardwareTXError`, { value });
  ledgerStorage.set(HARDWARE_TX_ERROR_KEY, value);
};

const Swipe = createMaterialTopTabNavigator();

export const HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT = 534;

export type HardwareWalletTxParams = {
  submit: () => void;
};

type RouteParams = {
  HardwareWalletTxParams: HardwareWalletTxParams;
};

// atoms used for navigator state
export const LedgerIsReadyAtom = atom({
  default: false,
  key: 'ledgerIsReady',
});
export const readyForPollingAtom = atom({
  default: true,
  key: 'readyForPolling',
});

export const triggerPollerCleanupAtom = atom({
  default: false,
  key: 'triggerPollerCleanup',
});

export const HardwareWalletTxNavigator = () => {
  const { width, height } = useDimensions();
  const { selectedWallet } = useWallets();
  const {
    params: { submit },
  } = useRoute<RouteProp<RouteParams, 'HardwareWalletTxParams'>>();

  const { navigate } = useNavigation();

  const deviceId = selectedWallet?.deviceId;
  const [isReady, setIsReady] = useRecoilState(LedgerIsReadyAtom);
  const [readyForPolling, setReadyForPolling] = useRecoilState(readyForPollingAtom);
  const [triggerPollerCleanup, setTriggerPollerCleanup] = useRecoilState(triggerPollerCleanupAtom);

  const errorCallback = useCallback(
    (errorType: LEDGER_ERROR_CODES) => {
      if (errorType === LEDGER_ERROR_CODES.NO_ETH_APP || errorType === LEDGER_ERROR_CODES.OFF_OR_LOCKED) {
        navigate(Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET, {
          errorType,
          deviceId,
        });
      } else {
        // silent for now
      }
    },
    [deviceId, navigate]
  );

  const successCallback = useCallback(() => {
    logger.debug('[LedgerTx] - submitting tx', {}, DebugContext.ledger);
    if (!isReady) {
      setReadyForPolling(false);
      setIsReady(true);
      setHardwareTXError(false);
      submit();
    } else {
      logger.debug('[LedgerTx] - already submitted', {}, DebugContext.ledger);
    }
  }, [isReady, setIsReady, setReadyForPolling, submit]);

  useLedgerConnect({
    deviceId,
    readyForPolling,
    errorCallback,
    successCallback,
  });

  // reset state when opening the sheet
  useEffect(() => {
    setIsReady(false);
    setReadyForPolling(true);
    setHardwareTXError(false);
    setTriggerPollerCleanup(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          backgroundColor={backgroundColor as string}
          customHeight={HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT}
          scrollEnabled={false}
        >
          <Swipe.Navigator
            initialLayout={{ width, height }}
            initialRouteName={Routes.PAIR_HARDWARE_WALLET_AGAIN_SHEET}
            screenOptions={{ swipeEnabled: false }}
            sceneContainerStyle={{ backgroundColor: backgroundColor }}
            tabBar={() => null}
          >
            <Swipe.Screen component={PairHardwareWalletAgainSheet} name={Routes.PAIR_HARDWARE_WALLET_AGAIN_SHEET} />
            <Swipe.Screen component={PairHardwareWalletErrorSheet} name={Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET} />
          </Swipe.Navigator>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};
