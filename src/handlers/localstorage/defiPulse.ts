import { getGlobal, saveGlobal } from './common';
import { IndexToken } from '@rainbow-me/entities';

// Key used for loading the cache with data from storage
export const DEFI_PULSE_FROM_STORAGE = 'defiPulseFromStorage';

const DEFI_PULSE = 'defiPulse';

interface DpiResult {
  base: IndexToken;
  underlying: IndexToken[];
}

export const getDefiPulse = (): Promise<DpiResult> => getGlobal(DEFI_PULSE, []);

export const saveDefiPulse = (defiPulseData: DpiResult) =>
  saveGlobal(DEFI_PULSE, defiPulseData);
