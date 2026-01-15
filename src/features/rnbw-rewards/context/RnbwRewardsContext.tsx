import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type RnbwRewardsContextType = {
  showAirdropFlow: boolean;
  setShowAirdropFlow: (show: boolean) => void;
};

const RnbwRewardsContext = createContext<RnbwRewardsContextType | null>(null);

export function RnbwRewardsContextProvider({ children }: { children: ReactNode }) {
  const [showAirdropFlow, setShowAirdropFlow] = useState<boolean>(false);

  const value = useMemo(() => ({ showAirdropFlow, setShowAirdropFlow }), [showAirdropFlow, setShowAirdropFlow]);

  return <RnbwRewardsContext.Provider value={value}>{children}</RnbwRewardsContext.Provider>;
}

export function useRnbwRewardsContext(): RnbwRewardsContextType {
  const context = useContext(RnbwRewardsContext);
  if (!context) {
    throw new Error('useRnbwRewardsContext must be used within RnbwRewardsContextProvider');
  }
  return context;
}
