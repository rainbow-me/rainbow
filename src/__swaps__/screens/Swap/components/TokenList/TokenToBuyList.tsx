import { StyleSheet } from 'react-native';
import React, { useMemo } from 'react';

import { useAssetsToBuySections } from '@/__swaps__/screens/Swap/hooks/useAssetsToBuy';
import { TokenToBuySection } from '@/__swaps__/screens/Swap/components/TokenList/TokenToBuySection';
import { Box } from '@/design-system';
import { isL2Chain } from '@/__swaps__/utils/chains';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { ChainSelection } from './ChainSelection';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

export const TokenToBuyList = () => {
  const { SwapInputController } = useSwapContext();
  const sections = useAssetsToBuySections();

  const isL2 = useMemo(
    () => SwapInputController.outputChainId.value && isL2Chain(SwapInputController.outputChainId.value),
    [SwapInputController.outputChainId.value]
  );

  const assetsCount = useDerivedValue(() => sections.value?.reduce((count, section) => count + section.data.length, 0));
  const emptyAnimatedStyle = useAnimatedStyle(() => ({ display: assetsCount.value === 0 ? 'none' : 'flex' }));

  return (
    <Box gap={32}>
      <ChainSelection output />
      <TokenToBuySection index={0} sections={sections} />
      <TokenToBuySection index={1} sections={sections} />
      <TokenToBuySection index={2} sections={sections} />
      <TokenToBuySection index={3} sections={sections} />
      <TokenToBuySection index={4} sections={sections} />
      <TokenToBuySection index={5} sections={sections} />
      <Animated.View style={emptyAnimatedStyle}>
        <ListEmpty isL2={isL2} />
      </Animated.View>
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
