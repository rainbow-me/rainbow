import { RnbwRewardsScene, RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { claimAirdrop } from '@/features/rnbw-rewards/utils/claimAirdrop';
import { claimRewards } from '@/features/rnbw-rewards/utils/claimRewards';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';

type TaskIdle = { status: 'idle'; runId: number };
type TaskRunning = { status: 'running'; runId: number };
type TaskSuccess<T> = { status: 'success'; runId: number; data: T };
type TaskError = { status: 'error'; runId: number; error: unknown };

export type AsyncActionState<T> = TaskIdle | TaskRunning | TaskSuccess<T> | TaskError;

type RewardsFlowStore = {
  activeScene: RnbwRewardsScene;
  airdropEligibilityRequest: AsyncActionState<void>;
  airdropClaimRequest: AsyncActionState<Awaited<ReturnType<typeof claimAirdrop>>>;
  rewardsClaimRequest: AsyncActionState<Awaited<ReturnType<typeof claimRewards>>>;
  resetFlow: (initialScene: RnbwRewardsScene) => void;
  setActiveScene: (scene: RnbwRewardsScene) => void;
  startAirdropEligibilityCheck: () => Promise<void>;
  startAirdropClaim: () => Promise<void>;
  startRewardsClaim: () => Promise<void>;
};

const createIdleAction = <T>(): AsyncActionState<T> => ({ status: 'idle', runId: 0 });

export const useRewardsFlowStore = createRainbowStore<RewardsFlowStore>((set, get) => ({
  activeScene: RnbwRewardsScenes.AirdropIntro,
  airdropEligibilityRequest: createIdleAction(),
  airdropClaimRequest: createIdleAction(),
  rewardsClaimRequest: createIdleAction(),

  resetFlow: initialScene =>
    set(state => ({
      activeScene: initialScene,
      airdropEligibilityRequest: { status: 'idle', runId: state.airdropEligibilityRequest.runId + 1 },
      airdropClaimRequest: { status: 'idle', runId: state.airdropClaimRequest.runId + 1 },
      rewardsClaimRequest: { status: 'idle', runId: state.rewardsClaimRequest.runId + 1 },
    })),

  setActiveScene: scene => set(state => ({ ...state, activeScene: scene })),

  startAirdropEligibilityCheck: async () => {
    const runId = get().airdropEligibilityRequest.runId + 1;
    set(state => ({ ...state, airdropEligibilityRequest: { status: 'running', runId } }));
    try {
      await delay(time.seconds(1));
      if (get().airdropEligibilityRequest.runId !== runId) return;
      set(state => ({ ...state, airdropEligibilityRequest: { status: 'success', runId, data: undefined } }));
    } catch (error) {
      if (get().airdropEligibilityRequest.runId !== runId) return;
      set(state => ({ ...state, airdropEligibilityRequest: { status: 'error', runId, error } }));
    }
  },

  startAirdropClaim: async () => {
    const runId = get().airdropClaimRequest.runId + 1;
    set(state => ({ ...state, airdropClaimRequest: { status: 'running', runId } }));
    try {
      const address = useWalletsStore.getState().accountAddress;
      const currency = userAssetsStoreManager.getState().currency;
      const message = useAirdropBalanceStore.getState().getMessageToSign() ?? '';
      const data = await claimAirdrop({ message, address, currency });
      if (get().airdropClaimRequest.runId !== runId) return;
      set(state => ({ ...state, airdropClaimRequest: { status: 'success', runId, data } }));
    } catch (error) {
      if (get().airdropClaimRequest.runId !== runId) return;
      set(state => ({ ...state, airdropClaimRequest: { status: 'error', runId, error } }));
    }
  },

  startRewardsClaim: async () => {
    const runId = get().rewardsClaimRequest.runId + 1;
    set(state => ({ ...state, rewardsClaimRequest: { status: 'running', runId } }));
    try {
      const address = useWalletsStore.getState().accountAddress;
      const currency = userAssetsStoreManager.getState().currency;
      const data = await claimRewards({ address, currency });
      if (get().rewardsClaimRequest.runId !== runId) return;
      set(state => ({ ...state, rewardsClaimRequest: { status: 'success', runId, data } }));
    } catch (error) {
      if (get().rewardsClaimRequest.runId !== runId) return;
      set(state => ({ ...state, rewardsClaimRequest: { status: 'error', runId, error } }));
    }
  },
}));

export const rewardsFlowActions = createStoreActions(useRewardsFlowStore);
