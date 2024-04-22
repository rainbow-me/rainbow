import { StyleSheet } from 'react-native';
import React, { useMemo } from 'react';

import { useAssetsToBuySections } from '@/__swaps__/screens/Swap/hooks/useAssetsToBuy';
import { TokenToBuySection } from '@/__swaps__/screens/Swap/components/TokenList/TokenToBuySection';
import { Stack } from '@/design-system';
import { isL2Chain } from '@/__swaps__/utils/chains';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { ChainSelection } from './ChainSelection';

export const TokenToBuyList = () => {
  const { SwapInputController } = useSwapContext();
  const sections = useAssetsToBuySections();

  const isL2 = useMemo(
    () => SwapInputController.outputChainId.value && isL2Chain(SwapInputController.outputChainId.value),
    [SwapInputController.outputChainId.value]
  );

  const assetsCount = useMemo(() => sections?.reduce((count, section) => count + section.data.length, 0), [sections]);

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
