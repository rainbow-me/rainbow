import { createRainbowStore } from '@/state/internal/createRainbowStore';

/** Dev-only switch for the mock buy-order outcome. Removed when real ramp endpoints land */
export const CASH_MOCK_ORDER_OUTCOMES = ['succeed', 'fail'] as const;
export type CashMockOrderOutcome = (typeof CASH_MOCK_ORDER_OUTCOMES)[number];

export function isCashMockOrderOutcome(value: string): value is CashMockOrderOutcome {
  return CASH_MOCK_ORDER_OUTCOMES.some(outcome => outcome === value);
}

type CashMockOrderOutcomeStore = {
  outcome: CashMockOrderOutcome;
  setOutcome: (outcome: CashMockOrderOutcome) => void;
};

export const useCashMockOrderOutcomeStore = createRainbowStore<CashMockOrderOutcomeStore>(set => ({
  outcome: 'succeed',
  setOutcome: outcome => set({ outcome }),
}));
