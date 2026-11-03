import React, { useCallback, useEffect } from 'react';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useRecoilState, useSetRecoilState } from 'recoil';

import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { BackgroundProvider } from '@/design-system';
import useDimensions from '@/hooks/useDimensions';
import { logger } from '@/logger';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { useSelectedWallet } from '@/state/wallets/walletsStore';

import { useLedgerConnect } from '../hooks/useLedgerConnect';
import { PairHardwareWalletAgainSheet } from '../screens/PairHardwareWalletAgainSheet';
import { PairHardwareWalletErrorSheet } from '../screens/PairHardwareWalletErrorSheet';
import { ledgerIsReadyAtom, readyForPollingAtom, setHardwareWalletTxError, triggerPollerCleanupAtom } from '../state/hardwareWalletTxState';
import { LEDGER_ERROR_CODES } from '../utils/ledger';
import { HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT } from './constants';

const Swipe = createMaterialTopTabNavigator();

export const HardwareWalletTxNavigator = () => {
  const { width, height } = useDimensions();
  const selectedWallet = useSelectedWallet();
  const {
    params: { submit },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.PAIR_HARDWARE_WALLET_AGAIN_SHEET>>();

  const { navigate } = useNavigation();

  const deviceId = selectedWallet?.deviceId ?? '';
  const [isReady, setIsReady] = useRecoilState(ledgerIsReadyAtom);
  const [readyForPolling, setReadyForPolling] = useRecoilState(readyForPollingAtom);
  const setTriggerPollerCleanup = useSetRecoilState(triggerPollerCleanupAtom);

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
    logger.debug('[HardwareWalletTxNavigator]: submitting tx', {});
    if (!isReady) {
      setReadyForPolling(false);
      setIsReady(true);
      setHardwareWalletTxError(false);
      submit();
    } else {
      logger.debug('[HardwareWalletTxNavigator]: already submitted', {});
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
    setHardwareWalletTxError(false);
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
