import { RnbwRewardsScene, RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { useHasCompletedAirdropFlow } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/hooks/useHasCompletedAirdropFlow';
import { rewardsFlowActions, useRewardsFlowStore } from '@/features/rnbw-rewards/stores/rewardsFlowStore';
import usePrevious from '@/hooks/usePrevious';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { createContext, ReactNode, useContext, useEffect, useMemo } from 'react';
import { SharedValue, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';

type RnbwRewardsFlowContextType = {
  activeScene: SharedValue<RnbwRewardsScene>;
  setActiveScene: (scene: RnbwRewardsScene) => void;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  scrollOffset: SharedValue<number>;
};

const RnbwRewardsFlowContext = createContext<RnbwRewardsFlowContextType | null>(null);

type RnbwRewardsFlowContextProviderProps = {
  children: ReactNode;
};

export function RnbwRewardsFlowContextProvider({ children }: RnbwRewardsFlowContextProviderProps) {
  const [hasCompletedAirdropFlow] = useHasCompletedAirdropFlow();

  const initialScene = useMemo(() => {
    return hasCompletedAirdropFlow ? RnbwRewardsScenes.RewardsOverview : RnbwRewardsScenes.AirdropIntro;
  }, [hasCompletedAirdropFlow]);

  const scrollOffset = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollOffset.value = event.contentOffset.y;
  });
  const activeScene = useStoreSharedValue(useRewardsFlowStore, state => state.activeScene, { fireImmediately: true });

  const value = useMemo(
    () => ({ activeScene, setActiveScene: rewardsFlowActions.setActiveScene, scrollHandler, scrollOffset }),
    [activeScene, scrollHandler, scrollOffset]
  );

  return (
    <RnbwRewardsFlowContext.Provider value={value}>
      {children}
      <RnbwRewardsFlowSideEffects activeScene={activeScene} initialScene={initialScene} />
    </RnbwRewardsFlowContext.Provider>
  );
}

export function useRnbwRewardsFlowContext(): RnbwRewardsFlowContextType {
  const context = useContext(RnbwRewardsFlowContext);
  if (!context) {
    throw new Error('useRnbwRewardsFlowContext must be used within RnbwRewardsFlowContextProvider');
  }
  return context;
}

type RnbwRewardsFlowSideEffectsProps = {
  activeScene: SharedValue<RnbwRewardsScene>;
  initialScene: RnbwRewardsScene;
};

function RnbwRewardsFlowSideEffects({ initialScene }: RnbwRewardsFlowSideEffectsProps) {
  const accountAddress = useAccountAddress();
  const activeSceneState = useRewardsFlowStore(state => state.activeScene);
  const [hasCompletedAirdropFlow, setHasCompletedAirdropFlow] = useHasCompletedAirdropFlow();
  const previousAccountAddress = usePrevious(accountAddress);
  const hasClaimedAirdrop = useAirdropBalanceStore(state => state.hasClaimedAirdrop() === true);

  useEffect(() => {
    if (previousAccountAddress === accountAddress) return;
    rewardsFlowActions.resetFlow(initialScene);
  }, [accountAddress, initialScene, previousAccountAddress]);

  useEffect(() => {
    if (hasCompletedAirdropFlow) return;
    if (activeSceneState === RnbwRewardsScenes.RewardsOverview) {
      setHasCompletedAirdropFlow(true);
    }
    // This handles the case where the user re-downloads after previously claiming the airdrop
    if (hasClaimedAirdrop && activeSceneState === RnbwRewardsScenes.AirdropIntro) {
      setHasCompletedAirdropFlow(true);
      rewardsFlowActions.resetFlow(RnbwRewardsScenes.RewardsOverview);
    }
  }, [activeSceneState, hasCompletedAirdropFlow, hasClaimedAirdrop, setHasCompletedAirdropFlow]);

  return null;
}
