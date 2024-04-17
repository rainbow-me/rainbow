import { Text as RNText, StyleSheet } from 'react-native';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import React, { useCallback, useMemo } from 'react';

import { useAssetsToBuySections } from '@/__swaps__/screens/Swap/hooks/useAssetsToBuy';
import { TokenToBuySection } from '@/__swaps__/screens/Swap/components/TokenList/TokenToBuySection';
import { AnimatedText, Bleed, Box, HitSlop, Inline, Stack, Text, useColorMode, useForegroundColor } from '@/design-system';
import { chainNameFromChainIdWorklet, isL2Chain } from '@/__swaps__/utils/chains';
import { opacity } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { ethereumUtils } from '@/utils';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId } from '@/__swaps__/types/chains';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';

export const TokenToBuyList = () => {
  const { isDarkMode } = useColorMode();
  const { SwapInputController } = useSwapContext();
  const sections = useAssetsToBuySections();
  const red = useForegroundColor('red');

  const chainName = useSharedValue(
    SwapInputController.outputChainId.value === ChainId.mainnet
      ? 'ethereum'
      : chainNameFromChainIdWorklet(SwapInputController.outputChainId.value)
  );

  const isL2 = useMemo(
    () => SwapInputController.outputChainId.value && isL2Chain(SwapInputController.outputChainId.value),
    [SwapInputController.outputChainId.value]
  );

  const assetsCount = useMemo(() => sections?.reduce((count, section) => count + section.data.length, 0), [sections]);

  const switchToRandomChain = useCallback(() => {
    const chainIdValues = Object.values(ChainId).filter(value => typeof value === 'number');
    const randomChainId = chainIdValues[Math.floor(Math.random() * chainIdValues.length)];
    SwapInputController.outputChainId.value = randomChainId as ChainId;
  }, [SwapInputController]);

  useAnimatedReaction(
    () => SwapInputController.outputChainId.value,
    current => {
      chainName.value = current === ChainId.mainnet ? 'ethereum' : chainNameFromChainIdWorklet(current);
    }
  );

  return (
    <Stack space="24px">
      <Box paddingHorizontal="20px">
        <Inline alignHorizontal="justify" alignVertical="center">
          <Inline alignVertical="center" space="6px">
            <Bleed vertical="4px">
              <Box alignItems="center" justifyContent="center" marginBottom={{ custom: -0.5 }} width={{ custom: 16 }}>
                <Bleed space={isDarkMode ? '16px' : undefined}>
                  <RNText
                    style={
                      isDarkMode
                        ? [
                            styles.textIconGlow,
                            {
                              textShadowColor: opacity(red, 0.28),
                            },
                          ]
                        : undefined
                    }
                  >
                    <Text align="center" color="labelSecondary" size="icon 13px" weight="heavy">
                      􀆪
                    </Text>
                  </RNText>
                </Bleed>
              </Box>
            </Bleed>
            <Text color="labelSecondary" size="15pt" weight="heavy">
              Filter by Network
            </Text>
          </Inline>
          <ButtonPressAnimation onPress={switchToRandomChain}>
            <HitSlop space="10px">
              <Inline alignVertical="center" space="6px" wrap={false}>
                <ChainImage
                  chain={ethereumUtils.getNetworkFromChainId(SwapInputController.outputChainId.value ?? ChainId.mainnet)}
                  size={16}
                />
                <AnimatedText
                  align="right"
                  color={isDarkMode ? 'labelSecondary' : 'label'}
                  size="15pt"
                  weight="heavy"
                  style={{ textTransform: 'capitalize' }}
                  text={chainName}
                />
                <Text align="center" color={isDarkMode ? 'labelTertiary' : 'labelSecondary'} size="icon 13px" weight="bold">
                  􀆏
                </Text>
              </Inline>
            </HitSlop>
          </ButtonPressAnimation>
        </Inline>
      </Box>
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
