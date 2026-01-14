import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

export const ClaimSteps = {
  Introduction: 'introduction',
  CheckingAirdrop: 'checking-airdrop',
  Claim: 'claim',
  NothingToClaim: 'nothing-to-claim',
} as const;

export type ClaimStep = (typeof ClaimSteps)[keyof typeof ClaimSteps];

type RnbwAirdropContextType = {
  activeStep: SharedValue<ClaimStep>;
  activeStepState: ClaimStep;
  setActiveStep: (step: ClaimStep) => void;
};

const RnbwAirdropContext = createContext<RnbwAirdropContextType | null>(null);

const initialStep = ClaimSteps.Introduction;
export function RnbwAirdropContextProvider({ children }: { children: ReactNode }) {
  const activeStep = useSharedValue<ClaimStep>(initialStep);
  const [activeStepState, setActiveStepState] = useState<ClaimStep>(initialStep);

  useSyncSharedValue({
    compareDepth: 'shallow',
    pauseSync: false,
    sharedValue: activeStep,
    state: activeStepState,
    setState: setActiveStepState,
    syncDirection: 'sharedValueToState',
  });

  const setActiveStep = useCallback(
    (step: ClaimStep) => {
      'worklet';
      activeStep.value = step;
    },
    [activeStep]
  );

  const value = useMemo(() => ({ activeStep, activeStepState, setActiveStep }), [activeStep, activeStepState, setActiveStep]);

  return <RnbwAirdropContext.Provider value={value}>{children}</RnbwAirdropContext.Provider>;
}

export function useRnbwAirdropContext(): RnbwAirdropContextType {
  const context = useContext(RnbwAirdropContext);
  if (!context) {
    throw new Error('useRnbwAirdropContext must be used within RnbwAirdropContextProvider');
  }
  return context;
}
