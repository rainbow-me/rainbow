// ⚠️ Uncomment everything below to experiment with the QueryStore creator
// TODO: Comment out test code below before merging

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

type CurrencyStore = {
  currency: SupportedCurrencyKey;
  nestedParamTest: {
    currency: SupportedCurrencyKey;
  };
  setCurrency: (currency: SupportedCurrencyKey) => void;
};

const testAddresses: Address[] = [
  '0x2e67869829c734ac13723A138a952F7A8B56e774',
  '0xCFB83E14AEd465c79F3F82f4cfF4ff7965897644',
  '0x17cd072cBd45031EFc21Da538c783E0ed3b25DCc',
];

const useCurrencyStore = createRainbowStore<CurrencyStore>((set, get) => ({
  currency: 'USD',
  nestedParamTest: { currency: 'USD' },

  setCurrency: (currency: SupportedCurrencyKey) => {
    set({ currency });
    if (ENABLE_LOGS) console.log('[👤 useCurrencyStore 👤] New currency set:', get().currency);
  },
}));

type TestStore = {
  address: Address;
  userAssets: ParsedAssetsDictByChain;
  setAddress: (address: Address) => void;
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

export const useUserAssetsTestStore = createQueryStore<ParsedAssetsDictByChain, QueryParams, TestStore>(
  {
    fetcher: ({ address, currency }) => {
      if (ENABLE_LOGS) logFetchInfo({ address, currency });
      return queryUserAssets({ address, currency });
    },
    setData: (data, set) => set({ userAssets: data }),

    params: {
      address: ($, store) => $(store).address,
      currency: $ => $(useCurrencyStore).currency,
    },
    staleTime: time.minutes(1),
  },

  set => ({
    address: testAddresses[0],
    userAssets: [],
    setAddress: (address: Address) => set({ address }),
    setUserAssets: (data: ParsedAssetsDictByChain) => set({ userAssets: data }),
  }),

  { storageKey: 'userAssetsQueryStoreTest' }
);

export const UserAssetsTest = memo(function UserAssetsTest() {
  const data = useUserAssetsTestStore(state => state.userAssets);
  const enabled = useUserAssetsTestStore(state => state.enabled);

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
              const currentAddress = useUserAssetsTestStore.getState().address;
              switch (currentAddress) {
                case testAddresses[0]:
                  useUserAssetsTestStore.getState().setAddress(testAddresses[1]);
                  break;
                case testAddresses[1]:
                  useUserAssetsTestStore.getState().setAddress(testAddresses[2]);
                  break;
                case testAddresses[2]:
                  useUserAssetsTestStore.getState().setAddress(testAddresses[0]);
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
              useUserAssetsTestStore.setState({ enabled: !enabled });
            }}
            style={styles.button}
          >
            <Text color="label" size="17pt" weight="heavy">
              {useUserAssetsTestStore.getState().enabled ? 'Disable Fetching' : 'Enable Fetching'}
            </Text>
          </ButtonPressAnimation>
        </View>
      </View>
    )
  );
});

if (ENABLE_LOGS) console.log('[💾 UserAssetsTest 💾] Initial data exists:', !!useUserAssetsTestStore.getState().userAssets);

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
