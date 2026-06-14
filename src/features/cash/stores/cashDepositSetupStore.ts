import { type CashDepositSetupStatus } from '@/features/cash/stores/cashDepositSetupStatus';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

type CashDepositSetupStore = {
  /**
   * Cached Setup status — a fast-path hint only, never a gate. The server is authoritative
   * once auth lands; this is a mock driven from Developer Settings until then, and becomes
   * keyed by User (passkey identity) at that point.
   */
  cachedStatus: CashDepositSetupStatus;
  setStatus: (status: CashDepositSetupStatus) => void;
};

const DEFAULT_STATUS: CashDepositSetupStatus = 'needsIdentity';

export const useCashDepositSetupStore = createRainbowStore<CashDepositSetupStore>(
  set => ({
    cachedStatus: DEFAULT_STATUS,
    setStatus: status => set({ cachedStatus: status }),
  }),
  { storageKey: 'cashDepositSetup' }
);

/**
 * Stubbed `CashDepositSetupStatus` derivation: today it just reads the cached hint. The real
 * derivation (JWT claims + ramp GETs) lands with auth in Slice 7.
 */
export function useCashDepositSetupStatus(): CashDepositSetupStatus {
  return useCashDepositSetupStore(state => state.cachedStatus);
}
