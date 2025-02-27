import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Panel } from '@/components/SmoothPager/ListPanel';
import { Stack, Text } from '@/design-system';
import { safeAreaInsetValues, time } from '@/utils';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';

type UniqueId = `${string}_${string}`;

type PlaygroundStore = {
  uniqueId: UniqueId | null;
  setUniqueId: (uniqueId: UniqueId) => void;
};

export const playgroundStore = createRainbowStore<PlaygroundStore>(set => ({
  uniqueId: null,
  setUniqueId: uniqueId => {
    set({
      uniqueId,
    });
  },
}));

const fetchTokenPrice = async (params: TokenPriceParams): Promise<number> => {
  try {
    if (!params.token) {
      throw new Error('Invalid token');
    }
    return Math.random() * 100_000;
  } catch (error) {
    logger.error(new RainbowError('Failed to fetch token price'), {
      params,
      error,
    });

    return 0;
  }
};

type TokenPriceParams = {
  token: UniqueId | null;
};

export const tokenPriceStore = createQueryStore<number, TokenPriceParams>({
  abortInterruptedFetches: true,
  enabled: $ => $(playgroundStore, state => !!state.uniqueId),
  debugMode: true,
  keepPreviousData: false,
  cacheTime: time.hours(1),
  fetcher: fetchTokenPrice,
  enableNewChanges: false, // NOTE: CHANGE THIS TO 'TRUE' TO SEE THE NEW CHANGES
  params: {
    token: $ => $(playgroundStore, state => state.uniqueId),
  },
  staleTime: time.seconds(30),
});

export const QueryStorePlayground = () => {
  const uniqueId = playgroundStore(state => state.uniqueId);
  const isEnabled = tokenPriceStore(state => state.enabled);
  const data = tokenPriceStore(state => state.getData());

  return (
    <View style={styles.container}>
      <Panel height={DEVICE_HEIGHT - safeAreaInsetValues.top - safeAreaInsetValues.bottom}>
        <ScrollView contentContainerStyle={styles.scrollContent} scrollIndicatorInsets={{ bottom: 44, top: 44 }} style={styles.scrollView}>
          <Stack space="28px">
            <Text color="label" size="15pt" weight="semibold">
              Unique ID: {uniqueId}
            </Text>
            <Text color="label" size="15pt" weight="semibold">
              TOKEN PRICE (ENABLED: {isEnabled ? 'YES' : 'NO'})
            </Text>
            <Text color="labelSecondary" size="15pt" weight="semibold">
              TOKEN PRICE: {JSON.stringify(data, null, 2)}
            </Text>
          </Stack>
        </ScrollView>
      </Panel>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: safeAreaInsetValues.bottom,
  },
  scrollContent: {
    paddingBottom: 44,
    paddingTop: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 28,
  },
  separatorContainer: {
    marginTop: -16,
  },
});
