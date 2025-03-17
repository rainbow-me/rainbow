import React, { createContext, useCallback, useContext } from 'react';
import { noop } from 'lodash';
import { MMKV } from 'react-native-mmkv';
import { makeMutable, runOnJS, SharedValue, useSharedValue } from 'react-native-reanimated';
import { Address } from 'viem';
import useAccountSettings from '@/hooks/useAccountSettings';
import { logger } from '@/logger';

const mmkv = new MMKV();

const getInitialPositionsState = (accountAddress: Address) => {
  try {
    const positionsState = mmkv.getBoolean(`positions-open-${accountAddress}`);
    return positionsState ?? false;
  } catch (error) {
    logger.warn('Failed to get positions initial state', { error });
    return false;
  }
};

type PositionsContextType = {
  isExpanded: SharedValue<boolean>;
  toggleExpanded: () => void;
};

export const PositionsContext = createContext<PositionsContextType>({
  isExpanded: makeMutable(false),
  toggleExpanded: noop,
});

export const PositionsProvider = ({ children }: { children: React.ReactNode }) => {
  const { accountAddress } = useAccountSettings();
  const isExpanded = useSharedValue(getInitialPositionsState(accountAddress));

  const persistPositionsState = useCallback(
    (data: boolean) => {
      mmkv.set(`positions-open-${accountAddress}`, data);
    },
    [accountAddress]
  );

  const toggleExpanded = useCallback(() => {
    'worklet';

    isExpanded.value = !isExpanded.value;
    runOnJS(persistPositionsState)(isExpanded.value);
  }, [isExpanded, accountAddress]);

  return <PositionsContext.Provider value={{ isExpanded, toggleExpanded }}>{children}</PositionsContext.Provider>;
};

export const usePositionsContext = () => {
  return useContext(PositionsContext);
};
