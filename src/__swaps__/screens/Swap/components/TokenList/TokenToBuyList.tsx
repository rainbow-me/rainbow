import { StyleSheet } from 'react-native';
import React, { useMemo } from 'react';

import { useAssetsToBuySections } from '@/__swaps__/screens/Swap/hooks/useAssetsToBuy';
import { TokenToBuySection } from '@/__swaps__/screens/Swap/components/TokenList/TokenToBuySection';
import { Stack } from '@/design-system';
import { isL2Chain } from '@/__swaps__/utils/chains';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { ChainSelection } from './ChainSelection';
import { useSwapAssets } from '@/state/swaps/assets';

export const TokenToBuyList = () => {
  const sections = useAssetsToBuySections();
  const assetToSellChainId = useSwapAssets(state => state.assetToSell?.chainId);

  const isL2 = useMemo(() => {
    return assetToSellChainId && isL2Chain(assetToSellChainId);
  }, [assetToSellChainId]);

  const assetsCount = useMemo(() => sections?.reduce((count, section) => count + section.data.length, 0), [sections]);

  console.log('rendering token buy list');

  return (
    <Stack space="32px">
      <ChainSelection output />
      {sections.map(section => (
        <TokenToBuySection key={section.id} section={section} />
      ))}

      {!assetsCount && <ListEmpty isL2={isL2} />}
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
