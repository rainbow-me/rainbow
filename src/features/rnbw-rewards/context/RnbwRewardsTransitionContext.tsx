import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

export const ClaimSteps = {
  Introduction: 'introduction',
  CheckingAirdrop: 'checking-airdrop',
  ClaimingAirdrop: 'claiming-airdrop',
  ClaimingRewards: 'claiming-rewards',
  Claim: 'claim',
  AirdropClaimFinished: 'airdrop-claim-finished',
  Rewards: 'rewards',
  NothingToClaim: 'nothing-to-claim',
} as const;

export type ClaimStep = (typeof ClaimSteps)[keyof typeof ClaimSteps];

type RnbwRewardsTransitionContextType = {
  activeStep: SharedValue<ClaimStep>;
  activeStepState: ClaimStep;
  setActiveStep: (step: ClaimStep) => void;
};

const RnbwRewardsTransitionContext = createContext<RnbwRewardsTransitionContextType | null>(null);

type RnbwRewardsTransitionContextProviderProps = {
  children: ReactNode;
  initialStep?: ClaimStep;
};

export function RnbwRewardsTransitionContextProvider({
  children,
  initialStep = ClaimSteps.Introduction,
}: RnbwRewardsTransitionContextProviderProps) {
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

  return <RnbwRewardsTransitionContext.Provider value={value}>{children}</RnbwRewardsTransitionContext.Provider>;
}

export function useRnbwRewardsTransitionContext(): RnbwRewardsTransitionContextType {
  const context = useContext(RnbwRewardsTransitionContext);
  if (!context) {
    throw new Error('useRnbwRewardsTransitionContext must be used within RnbwRewardsTransitionContextProvider');
  }
  return context;
}
