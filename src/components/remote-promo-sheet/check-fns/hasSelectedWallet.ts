import store from '@/redux/store';

export const hasSelectedWallet = (): boolean => {
  const { selected } = store.getState().wallets;
  return !!selected;
};
