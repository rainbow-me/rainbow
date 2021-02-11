import { getGlobal, saveGlobal } from './common';

// Key used for loading the cache with data from storage
export const UNISWAP_POOLS_FROM_STORAGE = 'uniswapPoolsFromStorage';

const UNISWAP_POOLS = 'UNISWAP_POOLS';

// interface UniswapPoolsResult {}

export const getDefiPulse = (): Promise<any> => getGlobal(UNISWAP_POOLS, []);

export const saveDefiPulse = (data: any) => saveGlobal(UNISWAP_POOLS, data);
