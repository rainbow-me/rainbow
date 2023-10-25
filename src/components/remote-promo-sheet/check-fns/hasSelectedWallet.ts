import store from '@/redux/store';

export const hasSelectedWallet = (): boolean => {
  const { selected } = store.getState().wallets;

  console.log({ selected });
  return !!selected;
};
