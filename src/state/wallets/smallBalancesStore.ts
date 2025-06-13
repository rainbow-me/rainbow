import { createRainbowStore } from '../internal/createRainbowStore';

const useSmallBalancesStore = createRainbowStore<{
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
