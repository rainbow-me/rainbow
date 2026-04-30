import { useEffect } from 'react';

import { defaultConfig, POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { IS_INTERNAL, IS_TEST } from '@/env';
import { isTestnetChain } from '@/handlers/web3';
import useAccountSettings from '@/hooks/useAccountSettings';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { shallowEqual } from '@/worklets/comparisons';

export type DiscoverPlacementAvailability = {
  perps: boolean;
  predictions: boolean;
  enabled: boolean;
};

type DiscoverPlacementAvailabilityInput = {
  discoverPlacementsEnabled: boolean;
  perpsEnabled: boolean;
  polymarketEnabled: boolean;
  polymarketLocal: boolean;
  isTest: boolean;
  testnet: boolean;
};

type DiscoverPlacementNetworkState = {
  testnet: boolean;
  setTestnet: (testnet: boolean) => void;
};

const useDiscoverPlacementNetworkStore = createRainbowStore<DiscoverPlacementNetworkState>(set => ({
  testnet: false,
  setTestnet: testnet => set({ testnet }),
}));

export const useDiscoverPlacementAvailability = createDerivedStore<DiscoverPlacementAvailability>(
  $ => {
    const remoteConfig = $(
      useRemoteConfigStore,
      state => {
        const { discover_placements_enabled, perps_enabled, polymarket_enabled } = state.config;
        return { discover_placements_enabled, perps_enabled, polymarket_enabled };
      },
      shallowEqual
    );
    const polymarketLocal = $(
      useExperimentalConfigStore,
      state => IS_INTERNAL && (state.config[POLYMARKET] ?? defaultConfig[POLYMARKET].value)
    );
    const testnet = $(useDiscoverPlacementNetworkStore, state => state.testnet);

    return computeDiscoverPlacementAvailability({
      discoverPlacementsEnabled: remoteConfig.discover_placements_enabled,
      isTest: IS_TEST,
      perpsEnabled: remoteConfig.perps_enabled,
      polymarketEnabled: remoteConfig.polymarket_enabled,
      polymarketLocal,
      testnet,
    });
  },
  { equalityFn: shallowEqual }
);

export function useSyncDiscoverPlacementAvailabilityNetwork(): boolean {
  const { chainId } = useAccountSettings();
  const testnet = isTestnetChain({ chainId });
  const setTestnet = useDiscoverPlacementNetworkStore(state => state.setTestnet);

  useEffect(() => {
    setTestnet(testnet);
  }, [setTestnet, testnet]);

  return testnet;
}

export function computeDiscoverPlacementAvailability({
  discoverPlacementsEnabled,
  isTest,
  perpsEnabled,
  polymarketEnabled,
  polymarketLocal,
  testnet,
}: DiscoverPlacementAvailabilityInput): DiscoverPlacementAvailability {
  const placements = discoverPlacementsEnabled && !isTest && !testnet;
  const perps = placements && perpsEnabled;
  const predictions = placements && (polymarketEnabled || polymarketLocal);

  return { enabled: perps || predictions, perps, predictions };
}
