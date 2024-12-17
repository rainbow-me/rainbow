import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Address } from 'viem';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Text } from '@/design-system';
import { SupportedCurrencyKey } from '@/references';
import { queryUserAssets } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
import { ParsedAssetsDictByChain } from '@/__swaps__/types/assets';
import { createQueryStore, time } from '../createQueryStore';
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
    if (ENABLE_LOGS) console.log('[👤 useAddressStore 👤] New address set:', get().address);
  },
}));

type TestStore = {
  userAssets: ParsedAssetsDictByChain;
  getHighestValueAsset: () => number;
  setUserAssets: (data: ParsedAssetsDictByChain) => void;
};
type QueryParams = { address: Address; currency: SupportedCurrencyKey };

function logFetchInfo(params: QueryParams) {
  const formattedTimeWithSeconds = new Date(Date.now()).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  console.log('[🔄 UserAssetsTest - logFetchInfo 🔄]', '\nTime:', formattedTimeWithSeconds, '\nParams:', {
    address: params.address,
    currency: params.currency,
    raw: JSON.stringify(Object.values(params), null, 2),
  });
}

export const userAssetsTestStore = createQueryStore<ParsedAssetsDictByChain, QueryParams, TestStore>(
  {
    fetcher: ({ address, currency }) => {
      if (ENABLE_LOGS) logFetchInfo({ address, currency });
      return queryUserAssets({ address, currency });
    },
    setData: (data, set) => set({ userAssets: data }),

    params: {
      address: $ => $(useAddressStore).address,
      currency: $ => $(useAddressStore).currency,
    },
    staleTime: time.minutes(1),
  },

  (set, get) => ({
    userAssets: [],

    getHighestValueAsset: () =>
      Object.values(get().userAssets)
        .flatMap(chainAssets => Object.values(chainAssets))
        .reduce((max, asset) => Math.max(max, Number(asset.balance.display)), 0),

    setUserAssets: (data: ParsedAssetsDictByChain) => set({ userAssets: data }),
  }),

  {
    storageKey: 'userAssetsQueryStoreTest',
  }
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
              const currentAddress = useAddressStore.getState().address;
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
              {userAssetsTestStore.getState().enabled ? 'Disable Fetching' : 'Enable Fetching'}
            </Text>
          </ButtonPressAnimation>
        </View>
      </View>
    )
  );
});

if (ENABLE_LOGS) console.log('[💾 UserAssetsTest 💾] Initial data exists:', !!userAssetsTestStore.getState().userAssets);

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
    gap: 24,
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    gap: 32,
    justifyContent: 'center',
  },
});
