import { useBackendNetworks } from '@/resources/metadata/backendNetworks';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const BackendNetworks = () => {
  useBackendNetworks({
    onSuccess(data) {
      useBackendNetworksStore.getState().setBackendNetworks(data);
    },
  });

  return null;
};
