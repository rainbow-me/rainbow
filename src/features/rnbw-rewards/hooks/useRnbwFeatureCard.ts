import { createBaseStore } from '@storesjs/stores';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();

export const useRnbwFeatureCard = createBaseStore<{ isDismissed: boolean; dismiss: () => void }>(set => ({
  isDismissed: storage.getBoolean('dismissed-rnbw-feature-card') ?? false,
  dismiss: () => {
    storage.set('dismissed-rnbw-feature-card', true);
    set({ isDismissed: true });
  },
}));
