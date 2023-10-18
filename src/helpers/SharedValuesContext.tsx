import React, { PropsWithChildren, useContext, useMemo } from 'react';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useCoinListEdited } from '@/hooks';

const Context = React.createContext<
  | {
      isCoinListEdited: Animated.SharedValue<boolean>;
    }
  | undefined
>(undefined);

export function SharedValuesProvider({ children }: PropsWithChildren) {
  const { isCoinListEdited: rawIsCoinListEdited } = useCoinListEdited();
  const isCoinListEdited = useSharedValue(rawIsCoinListEdited);
  isCoinListEdited.value = rawIsCoinListEdited;

  const value = useMemo(
    () => ({
      isCoinListEdited,
    }),
    [isCoinListEdited]
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useIsCoinListEditedSharedValue() {
  return useContext(Context)!.isCoinListEdited;
}
