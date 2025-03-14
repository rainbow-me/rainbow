import React, { createContext, useCallback, useContext } from 'react';
import { noop } from 'lodash';

import { makeMutable, SharedValue, useSharedValue } from 'react-native-reanimated';

type PositionsContextType = {
  isExpanded: SharedValue<boolean>;
  toggleExpanded: () => void;
};

export const PositionsContext = createContext<PositionsContextType>({
  isExpanded: makeMutable(false),
  toggleExpanded: noop,
});

export const PositionsProvider = ({ children }: { children: React.ReactNode }) => {
  const isExpanded = useSharedValue(false);

  const toggleExpanded = useCallback(() => {
    'worklet';

    isExpanded.value = !isExpanded.value;
  }, [isExpanded]);

  return <PositionsContext.Provider value={{ isExpanded, toggleExpanded }}>{children}</PositionsContext.Provider>;
};

export const usePositionsContext = () => {
  return useContext(PositionsContext);
};
