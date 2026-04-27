import { createBaseStore } from '@storesjs/stores';

const useSmallBalancesStore = createBaseStore<{
  open: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
}>((set, get) => ({
  open: false,
  setOpen: open => {
    set({ open });
  },
  toggle() {
    set({
      open: !get().open,
    });
  },
}));

export const setIsSmallBalancesOpen = useSmallBalancesStore.getState().setOpen;
export const toggleOpenSmallBalances = useSmallBalancesStore.getState().toggle;

export function useOpenSmallBalances() {
  const { open: isSmallBalancesOpen } = useSmallBalancesStore();

  return {
    isSmallBalancesOpen,
    setIsSmallBalancesOpen,
    toggleOpenSmallBalances,
  };
}
