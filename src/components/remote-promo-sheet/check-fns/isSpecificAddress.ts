import store from '@/redux/store';
import { EthereumAddress } from '@/entities';
import { ActionFn } from '../checkForCampaign';

type props = {
  addresses: EthereumAddress[];
};

export const isSpecificAddress: ActionFn<props> = async ({ addresses }) => {
  const { accountAddress } = store.getState().settings;
  return addresses.map(address => address.toLowerCase()).includes(accountAddress.toLowerCase());
};
