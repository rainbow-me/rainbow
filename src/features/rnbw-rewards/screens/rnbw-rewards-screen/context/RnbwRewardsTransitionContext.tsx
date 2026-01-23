import { ClaimStep, ClaimSteps } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/claimSteps';
import { useHasCompletedAirdrop } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/hooks/useHasCompletedAirdrop';
import {
  rnbwRewardsFlowActions,
  useRnbwRewardsFlowStore,
} from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwRewardsFlowStore';
import usePrevious from '@/hooks/usePrevious';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { createContext, ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SharedValue, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

type RnbwRewardsTransitionContextType = {
  activeStep: SharedValue<ClaimStep>;
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
  const scrollOffset = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollOffset.value = event.contentOffset.y;
  });

  // const setActiveStep = useCallback((step: ClaimStep) => {
  //   rnbwRewardsFlowActions.setActiveStep(step);
  // }, []);

  const value = useMemo(
    () => ({ activeStep, setActiveStep: rnbwRewardsFlowActions.setActiveStep, scrollHandler, scrollOffset }),
    [activeStep, scrollHandler, scrollOffset]
  );

  return (
    <RnbwRewardsTransitionContext.Provider value={value}>
      {children}
      <RnbwRewardsTransitionSideEffects activeStep={activeStep} initialStep={initialStep} />
    </RnbwRewardsTransitionContext.Provider>
  );
}

export function useRnbwRewardsTransitionContext(): RnbwRewardsTransitionContextType {
  const context = useContext(RnbwRewardsTransitionContext);
  if (!context) {
    throw new Error('useRnbwRewardsTransitionContext must be used within RnbwRewardsTransitionContextProvider');
  }
  return context;
}

type RnbwRewardsTransitionSideEffectsProps = {
  activeStep: SharedValue<ClaimStep>;
  initialStep: ClaimStep;
};

function RnbwRewardsTransitionSideEffects({ activeStep, initialStep }: RnbwRewardsTransitionSideEffectsProps) {
  const accountAddress = useAccountAddress();
  const activeStepState = useRnbwRewardsFlowStore(state => state.activeStep);
  const [hasCompletedAirdropFlow, setHasCompletedAirdropFlow] = useHasCompletedAirdrop();
  // const [isSyncReady, setIsSyncReady] = useState(false);
  const previousAccountAddress = usePrevious(accountAddress);

  useSyncSharedValue({
    compareDepth: 'shallow',
    // pauseSync: !isSyncReady,
    sharedValue: activeStep,
    state: activeStepState,
    syncDirection: 'stateToSharedValue',
  });

  useLayoutEffect(() => {
    if (previousAccountAddress === accountAddress) return;
    rnbwRewardsFlowActions.resetFlow(initialStep);
  }, [accountAddress, initialStep, previousAccountAddress]);

  useEffect(() => {
    if (hasCompletedAirdropFlow) return;
    if (
      activeStepState === ClaimSteps.ClaimAirdropFinished ||
      activeStepState === ClaimSteps.NoAirdropToClaim ||
      activeStepState === ClaimSteps.Rewards
    ) {
      setHasCompletedAirdropFlow(true);
    }
  }, [activeStepState, hasCompletedAirdropFlow, setHasCompletedAirdropFlow]);

  return null;
}
