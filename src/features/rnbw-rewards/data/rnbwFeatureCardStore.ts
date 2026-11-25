import { createBaseStore } from '@storesjs/stores';

type RnbwFeatureCardState = {
  isDismissed: boolean;
  dismiss: () => void;
};

export const useRnbwFeatureCardStore = createBaseStore<RnbwFeatureCardState>(
  set => ({
    isDismissed: false,

    dismiss: () => {
      set(state => (state.isDismissed ? state : { isDismissed: true }));
    },
  }),

  { storageKey: 'rnbwFeatureCardStore' }
);
