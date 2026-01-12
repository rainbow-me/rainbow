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

type RnbwClaimContextType = {
  activeStep: SharedValue<ClaimStep>;
  activeStepState: ClaimStep;
  setActiveStep: (step: ClaimStep) => void;
};

const RnbwClaimContext = createContext<RnbwClaimContextType | null>(null);

export function RnbwClaimContextProvider({ children }: { children: ReactNode }) {
  const activeStep = useSharedValue<ClaimStep>(ClaimSteps.Introduction);
  const [activeStepState, setActiveStepState] = useState<ClaimStep>(ClaimSteps.Introduction);

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

  return <RnbwClaimContext.Provider value={value}>{children}</RnbwClaimContext.Provider>;
}

export function useRnbwClaimContext(): RnbwClaimContextType {
  const context = useContext(RnbwClaimContext);
  if (!context) {
    throw new Error('useRnbwClaimContext must be used within RnbwClaimContextProvider');
  }
  return context;
}
