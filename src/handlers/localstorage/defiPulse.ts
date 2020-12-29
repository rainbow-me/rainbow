import { getGlobal, saveGlobal } from './common';

// Key used for loading the cache with data from storage
export const DEFI_PULSE_FROM_STORAGE = 'defiPulseFromStorage';

const DEFI_PULSE = 'defiPulse';

// TODO JIN - may need to update definition
interface Token {
  amount: string;
  address: string;
  decimals: number;
  name: string;
  symbol: string;
}

interface DpiResult {
  base: Token;
  underlying: Token[];
}

export const getDefiPulse = (): Promise<DpiResult> => getGlobal(DEFI_PULSE, []);

export const saveDefiPulse = (defiPulseData: DpiResult) =>
  saveGlobal(DEFI_PULSE, defiPulseData);
