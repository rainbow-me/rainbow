import { ClaimStep, ClaimSteps } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/claimSteps';
import { claimAirdrop } from '@/features/rnbw-rewards/utils/claimAirdrop';
import { claimRewards } from '@/features/rnbw-rewards/utils/claimRewards';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { useRnbwAirdropStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwAirdropStore';

type TaskIdle = { status: 'idle'; runId: number };
type TaskRunning = { status: 'running'; runId: number };
type TaskSuccess<T> = { status: 'success'; runId: number; data: T };
type TaskError = { status: 'error'; runId: number; error: unknown };

export type TaskState<T> = TaskIdle | TaskRunning | TaskSuccess<T> | TaskError;

type RnbwRewardsFlowStore = {
  activeStep: ClaimStep;
  checkingAirdrop: TaskState<void>;
  claimAirdrop: TaskState<Awaited<ReturnType<typeof claimAirdrop>>>;
  claimRewards: TaskState<Awaited<ReturnType<typeof claimRewards>>>;
  resetFlow: (initialStep: ClaimStep) => void;
  setActiveStep: (step: ClaimStep) => void;
  startCheckingAirdrop: () => Promise<void>;
  startClaimAirdrop: () => Promise<void>;
  startClaimRewards: () => Promise<void>;
};

const createIdleTask = <T>(): TaskState<T> => ({ status: 'idle', runId: 0 });

export const useRnbwRewardsFlowStore = createRainbowStore<RnbwRewardsFlowStore>((set, get) => ({
  activeStep: ClaimSteps.AirdropIntroduction,
  checkingAirdrop: createIdleTask(),
  claimAirdrop: createIdleTask(),
  claimRewards: createIdleTask(),

  resetFlow: initialStep =>
    set(state => ({
      activeStep: initialStep,
      checkingAirdrop: { status: 'idle', runId: state.checkingAirdrop.runId + 1 },
      claimAirdrop: { status: 'idle', runId: state.claimAirdrop.runId + 1 },
      claimRewards: { status: 'idle', runId: state.claimRewards.runId + 1 },
    })),

  setActiveStep: step => set(state => ({ ...state, activeStep: step })),

  startCheckingAirdrop: async () => {
    const runId = get().checkingAirdrop.runId + 1;
    set(state => ({ ...state, checkingAirdrop: { status: 'running', runId } }));
    try {
      await delay(time.seconds(1));
      if (get().checkingAirdrop.runId !== runId) return;
      set(state => ({ ...state, checkingAirdrop: { status: 'success', runId, data: undefined } }));
    } catch (error) {
      if (get().checkingAirdrop.runId !== runId) return;
      set(state => ({ ...state, checkingAirdrop: { status: 'error', runId, error } }));
    }
  },

  startClaimAirdrop: async () => {
    const runId = get().claimAirdrop.runId + 1;
    set(state => ({ ...state, claimAirdrop: { status: 'running', runId } }));
    try {
      const address = useWalletsStore.getState().accountAddress;
      const currency = userAssetsStoreManager.getState().currency;
      const message = useRnbwAirdropStore.getState().getMessageToSign() ?? '';
      const data = await claimAirdrop({ message, address, currency });
      if (get().claimAirdrop.runId !== runId) return;
      set(state => ({ ...state, claimAirdrop: { status: 'success', runId, data } }));
    } catch (error) {
      if (get().claimAirdrop.runId !== runId) return;
      set(state => ({ ...state, claimAirdrop: { status: 'error', runId, error } }));
    }
  },

  startClaimRewards: async () => {
    const runId = get().claimRewards.runId + 1;
    set(state => ({ ...state, claimRewards: { status: 'running', runId } }));
    try {
      const address = useWalletsStore.getState().accountAddress;
      const currency = userAssetsStoreManager.getState().currency;
      const data = await claimRewards({ address, currency });
      if (get().claimRewards.runId !== runId) return;
      set(state => ({ ...state, claimRewards: { status: 'success', runId, data } }));
    } catch (error) {
      if (get().claimRewards.runId !== runId) return;
      set(state => ({ ...state, claimRewards: { status: 'error', runId, error } }));
    }
  },
}));

export const rnbwRewardsFlowActions = createStoreActions(useRnbwRewardsFlowStore);
