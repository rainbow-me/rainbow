import { type RnbwAirdropScene, RnbwAirdropScenes } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/constants/airdropScenes';
import { submitAirdropClaim, type PreparedAirdropClaim } from '@/features/rnbw-rewards/utils/claimAirdrop';
import { ensureError } from '@/logger';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';

type TaskIdle = { status: 'idle'; runId: number };
type TaskRunning = { status: 'running'; runId: number };
type TaskSuccess<T> = { status: 'success'; runId: number; data: T };
type TaskError = { status: 'error'; runId: number; error: string };

export type AirdropAsyncActionState<T> = TaskIdle | TaskRunning | TaskSuccess<T> | TaskError;

type AirdropFlowStore = {
  activeScene: RnbwAirdropScene;
  airdropClaimRequest: AirdropAsyncActionState<Awaited<ReturnType<typeof submitAirdropClaim>>>;
  reset: () => void;
  setActiveScene: (scene: RnbwAirdropScene) => void;
  startAirdropClaimSubmission: (preparedClaim: PreparedAirdropClaim) => Promise<void>;
};

export const useAirdropFlowStore = createRainbowStore<AirdropFlowStore>((set, get) => ({
  activeScene: RnbwAirdropScenes.AirdropClaimPrompt,
  airdropClaimRequest: { status: 'idle', runId: 0 },

  reset: () =>
    set(state => ({
      activeScene: RnbwAirdropScenes.AirdropClaimPrompt,
      airdropClaimRequest: { status: 'idle', runId: state.airdropClaimRequest.runId + 1 },
    })),

  setActiveScene: scene => set(() => ({ activeScene: scene })),

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
      const errorMessage = ensureError(error).message;
      set(state => {
        if (state.airdropClaimRequest.runId !== runId) return state;
        return { airdropClaimRequest: { status: 'error', runId, error: errorMessage } };
      });
    }
  },
}));

export const airdropFlowActions = createStoreActions(useAirdropFlowStore);
