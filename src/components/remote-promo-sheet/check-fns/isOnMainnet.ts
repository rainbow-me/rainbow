import { Network } from '@/helpers';
import store from '@/redux/store';

export const isOnMainnet = () => {
  const { network } = store.getState().settings;

  return network === Network.mainnet;
};
