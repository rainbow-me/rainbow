import { getGlobal, saveGlobal } from './common';

// Key used for loading the cache with data from storage
export const WALLET_BALANCE_NAMES_FROM_STORAGE = 'walletBalanceNamesStorage';

const BALANCE_NAMES = 'balanceNames';

const balanceNamesVersion = '0.1.0';

export const getWalletBalanceNames = () =>
  getGlobal(BALANCE_NAMES, {}, balanceNamesVersion);

export const saveWalletBalanceNames = walletBalanceNames =>
  saveGlobal(BALANCE_NAMES, walletBalanceNames);
