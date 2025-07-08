import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const useChainsLabel = () => useBackendNetworksStore.getState().getChainsNativeAsset();
