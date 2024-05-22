import { Network } from '@/helpers';
import { getNetworkObj } from '@/networks';
import { useRoute } from '@react-navigation/native';

export const useRouteNetwork = () => {
  const { params } = useRoute();
  const { currentNetwork } = (params as any) || {};

  return currentNetwork as Network;
};

export const useRouteChainId = () => {
  const network = useRouteNetwork();
  return getNetworkObj(network).id;
};
