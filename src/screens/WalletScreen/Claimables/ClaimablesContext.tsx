import React, { createContext, useCallback, useContext } from 'react';
import { noop } from 'lodash';
import { MMKV } from 'react-native-mmkv';
import { makeMutable, runOnJS, SharedValue, useSharedValue } from 'react-native-reanimated';
import { Address } from 'viem';
import useAccountSettings from '@/hooks/useAccountSettings';
import { logger } from '@/logger';

const mmkv = new MMKV();

const getInitialClaimablesState = (accountAddress: Address) => {
  try {
    const claimablesState = mmkv.getBoolean(`claimables-open-${accountAddress}`);
    return claimablesState ?? false;
  } catch (error) {
    logger.warn('Failed to get claimables initial state', { error });
    return false;
  }
};

type ClaimablesContextType = {
  isExpanded: SharedValue<boolean>;
  toggleExpanded: () => void;
};

export const ClaimablesContext = createContext<ClaimablesContextType>({
  isExpanded: makeMutable(false),
  toggleExpanded: noop,
});

export const ClaimablesProvider = ({ children }: { children: React.ReactNode }) => {
  const { accountAddress } = useAccountSettings();
  const isExpanded = useSharedValue(getInitialClaimablesState(accountAddress));

  const persistClaimablesState = useCallback(
    (data: boolean) => {
      mmkv.set(`claimables-open-${accountAddress}`, data);
    },
    [accountAddress]
  );

  const toggleExpanded = useCallback(() => {
    'worklet';

    isExpanded.value = !isExpanded.value;
    runOnJS(persistClaimablesState)(isExpanded.value);
  }, [isExpanded, accountAddress]);

  return <ClaimablesContext.Provider value={{ isExpanded, toggleExpanded }}>{children}</ClaimablesContext.Provider>;
};

export const useClaimablesContext = () => {
  return useContext(ClaimablesContext);
};
