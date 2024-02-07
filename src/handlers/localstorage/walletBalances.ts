import { getGlobal, saveGlobal } from './common';

// Key used for loading the cache with data from storage
export const WALLET_BALANCES_FROM_STORAGE = 'walletBalancesStorage';

const WALLET_BALANCES = 'walletBalances';

export const getWalletBalances = () => getGlobal(WALLET_BALANCES, {});

export const saveWalletBalances = (walletBalances: any) => saveGlobal(WALLET_BALANCES, walletBalances);
