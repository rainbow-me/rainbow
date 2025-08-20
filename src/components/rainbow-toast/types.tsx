import { RainbowTransaction } from '@/entities';

export type RainbowToast = {
  id: string;
  updatedAt: number;
  transaction: RainbowTransaction;
  isRemoving: boolean;
  removalReason?: 'swipe' | 'finish';
  timeoutId?: NodeJS.Timeout;
};
