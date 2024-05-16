import React from 'react';
import { StyleSheet } from 'react-native';
import { CoinRow2 } from '@/__swaps__/screens/Swap/components/CoinRow2';
import { Stack } from '@/design-system';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { FlashList } from '@shopify/flash-list';
import { ChainSelection } from './ChainSelection';
import { userAssetsStore } from '@/state/assets/userAssets';
import { COIN_ROW_LIST_WIDTH, COIN_ROW_LIST_HEIGHT, COIN_ROW_HEIGHT } from '../../constants';

export const TokenToSellList = () => {
  const assetIds = userAssetsStore(state => state.filteredUserAssetsById);

  return (
    <Stack space="20px">
      <ChainSelection allText="All Networks" output={false} />
      <FlashList
        data={assetIds}
        estimatedItemSize={COIN_ROW_HEIGHT}
        estimatedListSize={{
          height: COIN_ROW_LIST_HEIGHT,
          width: COIN_ROW_LIST_WIDTH,
        }}
        ListEmptyComponent={<ListEmpty />}
        keyExtractor={item => item}
        renderItem={({ item }) => <CoinRow2 assetId={item} />}
      />
    </Stack>
  );
};

export const styles = StyleSheet.create({
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
