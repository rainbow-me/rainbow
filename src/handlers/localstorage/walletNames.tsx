import { getGlobal, saveGlobal } from './common';

const WALLET_NAMES = 'walletNames';

export const getWalletNames = () => getGlobal(WALLET_NAMES, {});

export const saveWalletNames = walletNames =>
  saveGlobal(WALLET_NAMES, walletNames);
