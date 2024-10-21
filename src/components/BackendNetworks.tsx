import { useBackendNetworks } from '@/resources/metadata/backendNetworks';
import { backendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const BackendNetworks = () => {
  useBackendNetworks({
    onSuccess(data) {
      backendNetworksStore.getState().setBackendNetworks(data);
    },
  });

  return null;
};
