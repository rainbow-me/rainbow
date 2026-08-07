import { createBaseStore } from '@storesjs/stores';

type SetupCancelSheetStore = {
  visible: boolean;
  open: () => void;
  close: () => void;
};

export const useSetupCancelSheetStore = createBaseStore<SetupCancelSheetStore>(set => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));
