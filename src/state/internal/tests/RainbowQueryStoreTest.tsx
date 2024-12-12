import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Address } from 'viem';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Text } from '@/design-system';
import { SupportedCurrencyKey } from '@/references';
import { queryUserAssets } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
import { ParsedAssetsDictByChain } from '@/__swaps__/types/assets';
import { createRainbowQueryStore } from '../createRainbowQueryStore';

function getRandomAddress() {
  return Math.random() < 0.5 ? '0x2e67869829c734ac13723A138a952F7A8B56e774' : '0xCFB83E14AEd465c79F3F82f4cfF4ff7965897644';
}

type QueryParams = { address: Address; currency: SupportedCurrencyKey };

type TestStore = {
  userAssets: ParsedAssetsDictByChain;
  getHighestValueAsset: () => number;
  setUserAssets: (data: ParsedAssetsDictByChain) => void;
};

export const userAssetsStore = createRainbowQueryStore<ParsedAssetsDictByChain, QueryParams, TestStore, ParsedAssetsDictByChain>(
  {
    fetcher: () => queryUserAssets({ address: getRandomAddress(), currency: 'USD' }),
    // onFetched: (data, store) => store.setState({ userAssets: data }),
    transform: data => {
      const formattedTimeWithSeconds = new Date(Date.now()).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      console.log('[Transform - Last Fetch Attempt]: ', formattedTimeWithSeconds);
      return data;
    },

    disableDataCache: false,
    queryKey: ['userAssets'],
    staleTime: 30 * 60 * 1000, // 30m
  },
  (set, get) => ({
    userAssets: [],

    getHighestValueAsset: () => {
      const data = get().userAssets;
      const highestValueAsset = Object.values(data)
        .flatMap(chainAssets => Object.values(chainAssets))
        .reduce((max, asset) => {
          return Math.max(max, Number(asset.balance.display));
        }, 0);
      return highestValueAsset;
    },

    setUserAssets: (data: ParsedAssetsDictByChain) => set({ userAssets: data }),
  }),
  {
    // partialize: state => ({ userAssets: state.userAssets }),
    storageKey: 'userAssetsTesting79876',
  }
);

export const UserAssetsTest = memo(function UserAssetsTest() {
  const data = userAssetsStore(state => state.data);
  const enabled = userAssetsStore(state => state.enabled);

  console.log('RERENDER - enabled:', enabled);

  useEffect(() => {
    const status = userAssetsStore.getState().status;
    const isFetching = status === 'loading';
    // eslint-disable-next-line no-nested-ternary
    const emojiForStatus = isFetching ? '🔄' : status === 'success' ? '✅' : '❌';
    console.log('[NEW STATUS]:', emojiForStatus, status);

    if (data) {
      const first5Tokens = Object.values(data)
        .flatMap(chainAssets => Object.values(chainAssets))
        .slice(0, 5);
      console.log('[First 5 Token Symbols]:', first5Tokens.map(token => token.symbol).join(', '));
    }
  }, [data]);

  return (
    data && (
      <View style={styles.container}>
        <Text color="label" size="17pt" weight="heavy">
          Number of assets: {Object.values(data).reduce((acc, chainAssets) => acc + Object.keys(chainAssets).length, 0)}
        </Text>
        <ButtonPressAnimation onPress={() => userAssetsStore.setState({ enabled: !enabled })} style={styles.button}>
          <Text color="label" size="17pt" weight="heavy">
            {enabled ? 'Disable fetching' : 'Enable fetching'}
          </Text>
        </ButtonPressAnimation>
      </View>
    )
  );
});

const initialData = userAssetsStore.getState().data;
console.log('[Initial Data Exists]:', !!initialData);

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: 'blue',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    gap: 32,
    justifyContent: 'center',
  },
});
