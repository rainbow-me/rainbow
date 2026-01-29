import { RnbwRewardsScene, RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { submitAirdropClaim, type PreparedAirdropClaim } from '@/features/rnbw-rewards/utils/claimAirdrop';
import { submitRewardsClaim, type PreparedRewardsClaim } from '@/features/rnbw-rewards/utils/claimRewards';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';

type TaskIdle = { status: 'idle'; runId: number };
type TaskRunning = { status: 'running'; runId: number };
type TaskSuccess<T> = { status: 'success'; runId: number; data: T };
type TaskError = { status: 'error'; runId: number; error: unknown };

export type AsyncActionState<T> = TaskIdle | TaskRunning | TaskSuccess<T> | TaskError;

type RewardsFlowStore = {
  activeScene: RnbwRewardsScene;
  airdropEligibilityRequest: AsyncActionState<void>;
  airdropClaimRequest: AsyncActionState<Awaited<ReturnType<typeof submitAirdropClaim>>>;
  rewardsClaimRequest: AsyncActionState<Awaited<ReturnType<typeof submitRewardsClaim>>>;
  resetFlow: (initialScene: RnbwRewardsScene) => void;
  setActiveScene: (scene: RnbwRewardsScene) => void;
  startAirdropEligibilityCheck: () => Promise<void>;
  startAirdropClaimSubmission: (preparedClaim: PreparedAirdropClaim) => Promise<void>;
  startRewardsClaimSubmission: (preparedClaim: PreparedRewardsClaim) => Promise<void>;
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

  setActiveScene: scene => set(() => ({ activeScene: scene })),

  startAirdropEligibilityCheck: async () => {
    set(state => ({ airdropEligibilityRequest: { status: 'running', runId: state.airdropEligibilityRequest.runId + 1 } }));
    const runId = get().airdropEligibilityRequest.runId;
    try {
      await delay(time.seconds(3));
      set(state => {
        if (state.airdropEligibilityRequest.runId !== runId) return state;
        return { airdropEligibilityRequest: { status: 'success', runId, data: undefined } };
      });
    } catch (error) {
      set(state => {
        if (state.airdropEligibilityRequest.runId !== runId) return state;
        return { airdropEligibilityRequest: { status: 'error', runId, error } };
      });
    }
  },

  startAirdropClaimSubmission: async preparedClaim => {
    set(state => ({ airdropClaimRequest: { status: 'running', runId: state.airdropClaimRequest.runId + 1 } }));
    const runId = get().airdropClaimRequest.runId;
    try {
      const currency = userAssetsStoreManager.getState().currency;
      const data = await submitAirdropClaim({ preparedClaim, currency });
      set(state => {
        if (state.airdropClaimRequest.runId !== runId) return state;
        return { airdropClaimRequest: { status: 'success', runId, data } };
      });
    } catch (error) {
      set(state => {
        if (state.airdropClaimRequest.runId !== runId) return state;
        return { airdropClaimRequest: { status: 'error', runId, error } };
      });
    }
  },

  startRewardsClaimSubmission: async preparedClaim => {
    set(state => ({ rewardsClaimRequest: { status: 'running', runId: state.rewardsClaimRequest.runId + 1 } }));
    const runId = get().rewardsClaimRequest.runId;
    try {
      const currency = userAssetsStoreManager.getState().currency;
      const data = await submitRewardsClaim({ preparedClaim, currency });
      set(state => {
        if (state.rewardsClaimRequest.runId !== runId) return state;
        return { rewardsClaimRequest: { status: 'success', runId, data } };
      });
    } catch (error) {
      set(state => {
        if (state.rewardsClaimRequest.runId !== runId) return state;
        return { rewardsClaimRequest: { status: 'error', runId, error } };
      });
    }
  },
}));

export const rewardsFlowActions = createStoreActions(useRewardsFlowStore);
