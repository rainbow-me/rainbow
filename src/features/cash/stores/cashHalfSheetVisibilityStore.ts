import { createBaseStore } from '@storesjs/stores';

type CashHalfSheetVisibilityStore = {
  count: number;
  register: () => void;
  unregister: () => void;
};

/** Mounted `CashStatusHalfSheet` instances; while any is open, back navigation is a no-op. */
export const useCashHalfSheetVisibilityStore = createBaseStore<CashHalfSheetVisibilityStore>(set => ({
  count: 0,
  register: () => set(state => ({ count: state.count + 1 })),
  unregister: () => set(state => ({ count: Math.max(0, state.count - 1) })),
}));

export function getIsCashHalfSheetOpen(): boolean {
  return useCashHalfSheetVisibilityStore.getState().count > 0;
}
