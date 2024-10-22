import { makeMutable, SharedValue } from 'react-native-reanimated';
import { queryClient } from '@/react-query';
import buildTimeNetworks from '@/references/networks.json';
import { backendNetworksQueryKey, BackendNetworksResponse } from '@/resources/metadata/backendNetworks';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

const INITIAL_BACKEND_NETWORKS = queryClient.getQueryData<BackendNetworksResponse>(backendNetworksQueryKey()) ?? buildTimeNetworks;

export interface BackendNetworksState {
  backendNetworks: BackendNetworksResponse;
  backendNetworksSharedValue: SharedValue<BackendNetworksResponse>;
  setBackendNetworks: (backendNetworks: BackendNetworksResponse) => void;
}

export const useBackendNetworksStore = createRainbowStore<BackendNetworksState>(set => ({
  backendNetworks: INITIAL_BACKEND_NETWORKS,
  backendNetworksSharedValue: makeMutable<BackendNetworksResponse>(INITIAL_BACKEND_NETWORKS),

  setBackendNetworks: backendNetworks =>
    set(state => {
      state.backendNetworksSharedValue.value = backendNetworks;
      return {
        ...state,
        backendNetworks: backendNetworks,
      };
    }),
}));
