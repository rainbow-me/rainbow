import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type DummyClaimStatus = 'idle' | 'claiming' | 'success';

interface DummyClaimStore {
  claimStatus: DummyClaimStatus;
  claimAmountEth: string;
  claimAmountUsd: string;
  showClaimYourPoints: boolean;
  showMyEarnings: boolean;
  setClaimStatus: (status: DummyClaimStatus) => void;
}

export const useDummyClaimStore = createRainbowStore<DummyClaimStore>(set => ({
  claimStatus: 'idle',
  claimAmountEth: '0.0142025 ETH',
  claimAmountUsd: '$50.25',
  showClaimYourPoints: true,
  showMyEarnings: false,

  setClaimStatus: (status: DummyClaimStatus) => {
    if (status === 'claiming') {
      set({ claimStatus: 'claiming' });
      setTimeout(() => {
        set({ claimStatus: 'success', showClaimYourPoints: false, showMyEarnings: true });
      }, 3000);
    }
  },
}));
