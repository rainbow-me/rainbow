import React, { createContext, useCallback, useContext } from 'react';
import { noop } from 'lodash';

import { makeMutable, SharedValue, useSharedValue } from 'react-native-reanimated';

type ClaimablesContextType = {
  isExpanded: SharedValue<boolean>;
  toggleExpanded: () => void;
};

export const ClaimablesContext = createContext<ClaimablesContextType>({
  isExpanded: makeMutable(false),
  toggleExpanded: noop,
});

export const ClaimablesProvider = ({ children }: { children: React.ReactNode }) => {
  const isExpanded = useSharedValue(false);

  const toggleExpanded = useCallback(() => {
    'worklet';

    isExpanded.value = !isExpanded.value;
  }, [isExpanded]);

  return <ClaimablesContext.Provider value={{ isExpanded, toggleExpanded }}>{children}</ClaimablesContext.Provider>;
};

export const useClaimablesContext = () => {
  return useContext(ClaimablesContext);
};
