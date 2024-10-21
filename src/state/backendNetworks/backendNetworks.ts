import { BackendNetworksResponse } from '@/resources/metadata/backendNetworks';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { makeMutable, SharedValue } from 'react-native-reanimated';
import { logger, RainbowError } from '@/logger';
import buildTimeNetworks from '@/references/networks.json';

export interface BackendNetworksState {
  backendNetworks: SharedValue<BackendNetworksResponse>;
  setBackendNetworks: (backendNetworks: BackendNetworksResponse) => void;
}

type StateWithTransforms = Omit<Partial<BackendNetworksState>, 'backendNetworks'> & {
  backendNetworks: BackendNetworksResponse;
};

function serializer(state: Partial<BackendNetworksState>, version?: number) {
  try {
    const transformedStateToPersist: StateWithTransforms = {
      ...state,
      backendNetworks: state.backendNetworks ? state.backendNetworks.value : buildTimeNetworks,
    };

    return JSON.stringify({
      state: transformedStateToPersist,
      version,
    });
  } catch (error) {
    logger.error(new RainbowError(`[backendNetworksStore]: Failed to serialize state for backend networks storage`), {
      error,
    });
    throw error;
  }
}

function deserializer(serializedState: string) {
  let parsedState: { state: StateWithTransforms; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError(`[backendNetworksStore]: Failed to parse serialized state from backend networks storage`), {
      error,
    });
    throw error;
  }

  const { state, version } = parsedState;

  return {
    state: {
      ...state,
      backendNetworks: makeMutable(state.backendNetworks),
    },
    version,
  };
}

export const backendNetworksStore = createRainbowStore<BackendNetworksState>(
  set => ({
    backendNetworks: makeMutable(buildTimeNetworks),
    setBackendNetworks: (backendNetworks: BackendNetworksResponse) => set({ backendNetworks: makeMutable(backendNetworks) }),
  }),
  {
    storageKey: 'backendNetworks',
    version: 1,
    serializer,
    deserializer,
  }
);
