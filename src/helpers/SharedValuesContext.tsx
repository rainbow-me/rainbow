import React, { PropsWithChildren, useMemo } from 'react';
import { useSharedValue, SharedValue } from 'react-native-reanimated';
import { useCoinListEdited } from '@/hooks';

const Context = React.createContext<
  | {
      isCoinListEdited: SharedValue<boolean>;
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
