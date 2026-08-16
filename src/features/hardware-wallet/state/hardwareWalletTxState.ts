import { createMMKV } from 'react-native-mmkv';
import { atom } from 'recoil';

import { logger } from '@/logger';

export const hardwareWalletTxStorage = createMMKV({ id: 'ledgerStorage' });
export const HARDWARE_TX_ERROR_KEY = 'hardwareTXError';

export const ledgerIsReadyAtom = atom({
  default: false,
  key: 'ledgerIsReady',
});

export const readyForPollingAtom = atom({
  default: true,
  key: 'readyForPolling',
});

export const triggerPollerCleanupAtom = atom({
  default: false,
  key: 'triggerPollerCleanup',
});

export function setHardwareWalletTxError(value: boolean): void {
  logger.warn('[hardwareWalletTxState]: Setting transaction error state', { value });
  hardwareWalletTxStorage.set(HARDWARE_TX_ERROR_KEY, value);
}
