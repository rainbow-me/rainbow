import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Address } from 'viem';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Text } from '@/design-system';
import { SupportedCurrencyKey } from '@/references';
import { queryUserAssets } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
import { ParsedAssetsDictByChain } from '@/__swaps__/types/assets';
import { createRainbowQueryStore } from '../createRainbowQueryStore';
import { createRainbowStore } from '../createRainbowStore';

const ENABLE_LOGS = false;

type AddressStore = {
  address: Address;
  currency: SupportedCurrencyKey;
  nestedAddressTest: {
    address: Address;
  };
  setAddress: (address: Address) => void;
};

const testAddresses: Address[] = [
  '0x2e67869829c734ac13723A138a952F7A8B56e774',
  '0xCFB83E14AEd465c79F3F82f4cfF4ff7965897644',
  '0x17cd072cBd45031EFc21Da538c783E0ed3b25DCc',
];

const useAddressStore = createRainbowStore<AddressStore>((set, get) => ({
  address: testAddresses[0],
  currency: 'USD',
  nestedAddressTest: { address: testAddresses[0] },

  setAddress: (address: Address) => {
    set({ address });
    console.log('DID ADDRESS SET?', 'new address:', get().address);
  },
}));

type TestStore = {
  userAssets: ParsedAssetsDictByChain;
  getHighestValueAsset: () => number;
  setUserAssets: (data: ParsedAssetsDictByChain) => void;
};
type QueryParams = { address: Address; currency: SupportedCurrencyKey };

function logFetchInfo(params: QueryParams) {
  console.log('[PARAMS]:', JSON.stringify(params, null, 2));
  const formattedTimeWithSeconds = new Date(Date.now()).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  if (ENABLE_LOGS) {
    console.log('[🔄 Requesting Fetch] - Last Fetch Attempt:', formattedTimeWithSeconds, '\nParams:', {
      address: params.address,
      currency: params.currency,
    });
  }
}

export const userAssetsTestStore = createRainbowQueryStore<ParsedAssetsDictByChain, QueryParams, TestStore>(
  {
    fetcher: ({ address, currency }) => {
      if (ENABLE_LOGS) logFetchInfo({ address, currency });
      return queryUserAssets({ address, currency });
    },
    onFetched: (data, store) => store.setState({ userAssets: data }),

    params: {
      address: $ => $(useAddressStore).address,
      currency: $ => $(useAddressStore).currency,
    },
    staleTime: 20 * 1000, // 20s
  },

  (set, get) => ({
    userAssets: [],

    getHighestValueAsset: () =>
      Object.values(get().userAssets)
        .flatMap(chainAssets => Object.values(chainAssets))
        .reduce((max, asset) => Math.max(max, Number(asset.balance.display)), 0),

    setUserAssets: (data: ParsedAssetsDictByChain) => set({ userAssets: data }),
  })
);

export const UserAssetsTest = memo(function UserAssetsTest() {
  const data = userAssetsTestStore(state => state.userAssets);
  const enabled = userAssetsTestStore(state => state.enabled);

  useEffect(() => {
    if (ENABLE_LOGS) {
      const first5Tokens = Object.values(data)
        .flatMap(chainAssets => Object.values(chainAssets))
        .slice(0, 5);
      console.log('[🔔 UserAssetsTest 🔔] userAssets data updated - first 5 tokens:', first5Tokens.map(token => token.symbol).join(', '));
    }
  }, [data]);

  useEffect(() => {
    if (ENABLE_LOGS) console.log(`[🔔 UserAssetsTest 🔔] enabled updated to: ${enabled ? '✅ ENABLED' : '🛑 DISABLED'}`);
  }, [enabled]);

  return (
    data && (
      <View style={styles.container}>
        <Text color="label" size="17pt" weight="heavy">
          Number of assets: {Object.values(data).reduce((acc, chainAssets) => acc + Object.keys(chainAssets).length, 0)}
        </Text>
        <View style={styles.buttonGroup}>
          <ButtonPressAnimation
            onPress={() => {
              const currentAddress = useAddressStore.getState().nestedAddressTest.address;
              switch (currentAddress) {
                case testAddresses[0]:
                  useAddressStore.getState().setAddress(testAddresses[1]);
                  break;
                case testAddresses[1]:
                  useAddressStore.getState().setAddress(testAddresses[2]);
                  break;
                case testAddresses[2]:
                  useAddressStore.getState().setAddress(testAddresses[0]);
                  break;
              }
            }}
            style={styles.button}
          >
            <Text color="label" size="17pt" weight="heavy">
              Shuffle Address
            </Text>
          </ButtonPressAnimation>
          <ButtonPressAnimation
            onPress={() => {
              userAssetsTestStore.setState({ enabled: !enabled });
            }}
            style={styles.button}
          >
            <Text color="label" size="17pt" weight="heavy">
              {userAssetsTestStore.getState().enabled ? 'Disable fetching' : 'Enable fetching'}
            </Text>
          </ButtonPressAnimation>
        </View>
      </View>
    )
  );
});

if (ENABLE_LOGS) console.log('[💾 UserAssetsTest 💾] initial data exists:', !!userAssetsTestStore.getState().userAssets);

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: 'blue',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonGroup: {
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 24,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    gap: 32,
    justifyContent: 'center',
  },
});
