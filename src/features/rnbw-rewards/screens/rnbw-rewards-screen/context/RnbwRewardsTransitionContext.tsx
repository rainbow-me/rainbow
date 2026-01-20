import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { SharedValue, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

export const ClaimSteps = {
  AirdropIntroduction: 'airdrop-introduction',
  CheckingAirdrop: 'checking-airdrop',
  ClaimingAirdrop: 'claiming-airdrop',
  ClaimingRewards: 'claiming-rewards',
  ClaimAirdrop: 'claim-airdrop',
  ClaimAirdropFinished: 'claim-airdrop-finished',
  Rewards: 'rewards',
} as const;

export type ClaimStep = (typeof ClaimSteps)[keyof typeof ClaimSteps];

type RnbwRewardsTransitionContextType = {
  activeStep: SharedValue<ClaimStep>;
  activeStepState: ClaimStep;
  setActiveStep: (step: ClaimStep) => void;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  scrollOffset: SharedValue<number>;
};

const RnbwRewardsTransitionContext = createContext<RnbwRewardsTransitionContextType | null>(null);

type RnbwRewardsTransitionContextProviderProps = {
  children: ReactNode;
  initialStep?: ClaimStep;
};

export function RnbwRewardsTransitionContextProvider({
  children,
  initialStep = ClaimSteps.AirdropIntroduction,
}: RnbwRewardsTransitionContextProviderProps) {
  const activeStep = useSharedValue<ClaimStep>(initialStep);
  const [activeStepState, setActiveStepState] = useState<ClaimStep>(initialStep);
  const scrollOffset = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollOffset.value = event.contentOffset.y;
  });

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

  const value = useMemo(
    () => ({ activeStep, activeStepState, setActiveStep, scrollHandler, scrollOffset }),
    [activeStep, activeStepState, setActiveStep, scrollHandler, scrollOffset]
  );

  return <RnbwRewardsTransitionContext.Provider value={value}>{children}</RnbwRewardsTransitionContext.Provider>;
}

export function useRnbwRewardsTransitionContext(): RnbwRewardsTransitionContextType {
  const context = useContext(RnbwRewardsTransitionContext);
  if (!context) {
    throw new Error('useRnbwRewardsTransitionContext must be used within RnbwRewardsTransitionContextProvider');
  }
  return context;
}
