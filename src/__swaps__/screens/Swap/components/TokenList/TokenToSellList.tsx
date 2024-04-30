import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { useAssetsToSell } from '@/__swaps__/screens/Swap/hooks/useAssetsToSell';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { Box, Stack } from '@/design-system';
import Animated, { runOnUI } from 'react-native-reanimated';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { parseSearchAsset, isSameAsset } from '@/__swaps__/utils/assets';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { FlashList } from '@shopify/flash-list';
import { ChainSelection } from './ChainSelection';
import { useAssetsToSellSV } from '../../hooks/useAssetsToSellSV';
import { AnimatedCoinRow } from '../AnimatedCoinRow';

const AnimatedFlashListComponent = Animated.createAnimatedComponent(FlashList<ParsedSearchAsset>);

export const TokenToSellList = () => {
  const { SwapInputController } = useSwapContext();
  const sectionData = useAssetsToSellSV();

  const handleSelectToken = useCallback(
    (token: ParsedSearchAsset) => {
      const userAsset = sectionData.value.find(asset => isSameAsset(asset, token));
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: token,
        userAsset,
      });

      runOnUI(SwapInputController.onSetAssetToSell)(parsedAsset);
    },
    [SwapInputController.onSetAssetToSell, sectionData]
  );

  return (
    <Box gap={20}>
      <ChainSelection allText="All Networks" output={false} />
      <AnimatedCoinRow sectionData={sectionData} index={0} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={1} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={2} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={3} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={4} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={5} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={6} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={7} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={8} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={9} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={10} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={11} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={12} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={13} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={14} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={15} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={16} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={17} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={18} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={19} onPress={handleSelectToken} />
      <AnimatedCoinRow sectionData={sectionData} index={20} onPress={handleSelectToken} />
      {/* <AnimatedFlashListComponent
        data={userAssets.slice(0, 20)}
        ListEmptyComponent={<ListEmpty />}
        keyExtractor={item => item.uniqueId}
        renderItem={({ item }) => (
          <CoinRow
            key={item.uniqueId}
            chainId={item.chainId}
            color={item.colors?.primary ?? item.colors?.fallback}
            iconUrl={item.icon_url}
            address={item.address}
            mainnetAddress={item.mainnetAddress}
            balance={item.balance.display}
            name={item.name}
            onPress={() => handleSelectToken(item)}
            nativeBalance={item.native.balance.display}
            output={false}
            symbol={item.symbol}
          />
        )}
      /> */}
    </Box>
  );
};

export const styles = StyleSheet.create({
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
