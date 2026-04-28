import React, { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { JsonRpcProvider } from '@ethersproject/providers';
import { parseEther } from '@ethersproject/units';
import { Wallet } from '@ethersproject/wallet';
import { useSharedValue } from 'react-native-reanimated';

import { IS_DEV, IS_TEST } from '@/env';
import Emoji from '@/framework/ui/components/Emoji';
import { logger, RainbowError } from '@/logger';
import Navigation from '@/navigation/Navigation';
import { getFavorites } from '@/resources/favorites';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import Routes from '@rainbow-me/routes';

import DevButton from '../components/dev-buttons/DevButton';
import { showConnectToAnvilButton, showReloadButton, showSwitchModeButton } from '../config/debug';
import { useTheme } from '../theme/ThemeContext';

export type RainbowContextType = {
  setGlobalState: (newState: Record<string, unknown>) => void;
};

export const RainbowContext = createContext<RainbowContextType>({
  setGlobalState: () => {
    return;
  },
});

type E2EAnvilStatus = 'idle' | 'connected' | 'connect-error';
type E2EFundingStatus = 'idle' | 'funding' | 'funded' | 'funding-error';

export default function RainbowContextWrapper({ children }: PropsWithChildren) {
  // This value is hold here to prevent JS VM from shutting down
  // on unmounting all shared values.
  useSharedValue(0);
  const setConnectedToAnvil = useConnectedToAnvilStore(state => state.setConnectedToAnvil);
  const [e2eAnvilStatus, setE2EAnvilStatus] = useState<E2EAnvilStatus>('idle');
  const [e2eFundingStatus, setE2EFundingStatus] = useState<E2EFundingStatus>('idle');
  const [globalState, updateGlobalState] = useState({});

  useEffect(() => {
    if (IS_TEST) {
      getFavorites();
    }
  }, []);

  const setGlobalState = useCallback(
    (newState: Record<string, unknown>) => updateGlobalState(prev => ({ ...prev, ...(newState || {}) })),
    [updateGlobalState]
  );

  const initialValue = useMemo(
    () => ({
      ...globalState,
      setGlobalState,
    }),
    [globalState, setGlobalState]
  );

  const { isDarkMode, setTheme, colors } = useTheme();

  const connectToAnvil = useCallback(async () => {
    try {
      setConnectedToAnvil(true);
      setE2EAnvilStatus('connected');
      logger.debug('connected to anvil');
    } catch (e) {
      setConnectedToAnvil(false);
      setE2EAnvilStatus('connect-error');
      logger.error(new RainbowError('error connecting to anvil'), {
        message: e instanceof Error ? e.message : String(e),
      });
    }
    Navigation.handleAction(Routes.WALLET_SCREEN);
  }, [setConnectedToAnvil]);

  const fundTestWallet = useCallback(async () => {
    if (!IS_TEST) return;
    const RPC_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8545' : 'http://127.0.0.1:8545';
    try {
      setE2EFundingStatus('funding');
      const provider = new JsonRpcProvider(RPC_URL);
      await provider.getNetwork();
      const wallet = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
      const testWalletAddress = '0x4d14289265eb7c166cF111A76B6D742e3b85dF85';
      const transaction = await wallet.sendTransaction({
        to: testWalletAddress,
        value: parseEther('20'),
      });
      await transaction.wait(1);
      setE2EFundingStatus('funded');
    } catch (e) {
      setE2EFundingStatus('funding-error');
      logger.error(new RainbowError('error funding test wallet'), {
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  return (
    <RainbowContext.Provider value={initialValue}>
      {children}
      {IS_TEST && e2eFundingStatus !== 'idle' && (
        <View pointerEvents="none" style={styles.e2eMarker} testID={`e2e-anvil-${e2eFundingStatus}`} />
      )}
      {IS_TEST && e2eAnvilStatus !== 'idle' && (
        <View pointerEvents="none" style={styles.e2eMarker} testID={`e2e-anvil-${e2eAnvilStatus}`} />
      )}
      {showReloadButton && IS_DEV && <DevButton color={colors.red} initialDisplacement={200} />}
      {((showConnectToAnvilButton && IS_DEV) || IS_TEST) && (
        <>
          <DevButton color={colors.purple} onPress={connectToAnvil} initialDisplacement={150} testID={'dev-button-anvil'} size={20}>
            <Emoji>👷</Emoji>
          </DevButton>
          <DevButton color={colors.green} onPress={fundTestWallet} initialDisplacement={100} testID={'fund-test-wallet-button'} size={20}>
            <Emoji>💰</Emoji>
          </DevButton>
        </>
      )}
      {showSwitchModeButton && IS_DEV && (
        <DevButton color={colors.dark} onPress={() => setTheme(isDarkMode ? 'light' : 'dark')}>
          <Emoji>{isDarkMode ? '🌞' : '🌚'}</Emoji>
        </DevButton>
      )}
    </RainbowContext.Provider>
  );
}

const styles = StyleSheet.create({
  e2eMarker: {
    bottom: 0,
    height: 1,
    opacity: 0.01,
    position: 'absolute',
    right: 0,
    width: 1,
  },
});
