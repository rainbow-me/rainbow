/* eslint-disable react/jsx-props-no-spreading */
import c from 'chroma-js';
import { Text as RNText, StyleSheet } from 'react-native';
import Animated, { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import React, { useCallback, useMemo } from 'react';

import { SUPPORTED_CHAINS } from '@/references';
import { AnimatedText, Bleed, Box, HitSlop, Inline, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { chainNameFromChainId, chainNameFromChainIdWorklet } from '@/__swaps__/utils/chains';
import { opacity } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { ethereumUtils, showActionSheetWithOptions } from '@/utils';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId } from '@/__swaps__/types/chains';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ContextMenuButton } from '@/components/context-menu';
import { IS_ANDROID } from '@/env';
import { useAccountAccentColor } from '@/hooks';

type ChainSelectionProps = {
  allText?: string;
  output: boolean;
};

export const ChainSelection = ({ allText, output }: ChainSelectionProps) => {
  const { isDarkMode } = useColorMode();
  const { accentColor: accountColor } = useAccountAccentColor();
  const { SwapInputController } = useSwapContext();
  const red = useForegroundColor('red');

  const accentColor = useMemo(() => {
    if (c.contrast(accountColor, isDarkMode ? '#191A1C' : globalColors.white100) < (isDarkMode ? 2.125 : 1.5)) {
      const shiftedColor = isDarkMode ? c(accountColor).brighten(1).saturate(0.5).css() : c(accountColor).darken(0.5).saturate(0.5).css();
      return shiftedColor;
    } else {
      return accountColor;
    }
  }, [accountColor, isDarkMode]);

  // const propToUse = output ? SwapInputController.outputChainId : SwapInputController.

  const chainName = useSharedValue(
    !output
      ? allText
      : SwapInputController.outputChainId.value === ChainId.mainnet
        ? 'ethereum'
        : chainNameFromChainIdWorklet(SwapInputController.outputChainId.value)
  );

  // const switchToRandomChain = useCallback(() => {
  //   const chainIdValues = Object.values(ChainId).filter(value => typeof value === 'number');
  //   const randomChainId = chainIdValues[Math.floor(Math.random() * chainIdValues.length)];
  //   SwapInputController.outputChainId.value = randomChainId as ChainId;
  // }, [SwapInputController]);

  useAnimatedReaction(
    () => ({
      outputChainId: SwapInputController.outputChainId.value,
    }),
    current => {
      if (output) {
        chainName.value = current.outputChainId === ChainId.mainnet ? 'ethereum' : chainNameFromChainIdWorklet(current.outputChainId);
      }
    }
  );

  const handleSelectChain = useCallback(({ nativeEvent: { actionKey } }: any) => {
    console.log('actionKey', actionKey);
  }, []);

  const menuConfig = useMemo(() => {
    return {
      menuItems: SUPPORTED_CHAINS({ testnetMode: false }).map(chain => {
        // const network = ethereumUtils.getNetworkFromChainId(chain.id);
        return {
          actionKey: chain.id,
          actionTitle: chainNameFromChainId(chain.id),

          // TODO: Assets here
          // icon: {
          //   iconType: 'ASSET',
          //   iconValue: `${network.networkType === 'layer2' ? `${network}BadgeNoShadow` : 'ethereumBadge'}`,
          // },
        };
      }),
    };
  }, []);

  const onShowActionSheet = useCallback(() => {
    const chainTitles = menuConfig.menuItems.map(chain => chain.actionTitle);

    showActionSheetWithOptions(
      {
        options: chainTitles,
        showSeparators: true,
      },
      (index: number) => {
        handleSelectChain({ nativeEvent: { actionKey: menuConfig.menuItems[index].actionKey } });
      }
    );
  }, [handleSelectChain, menuConfig.menuItems]);

  return (
    <Box as={Animated.View} paddingHorizontal="20px">
      <Inline alignHorizontal="justify" alignVertical="center">
        {output ? (
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
        ) : (
          <Inline alignVertical="center" space="6px">
            <Bleed vertical="4px">
              <Box alignItems="center" justifyContent="center" width={{ custom: 18 }}>
                <Bleed space={isDarkMode ? '16px' : undefined}>
                  <RNText
                    style={
                      isDarkMode
                        ? [
                            styles.textIconGlow,
                            {
                              textShadowColor: opacity(accentColor, 0.2),
                            },
                          ]
                        : undefined
                    }
                  >
                    <Text align="center" color={{ custom: accentColor }} size="icon 13px" weight="black">
                      􀣽
                    </Text>
                  </RNText>
                </Bleed>
              </Box>
            </Bleed>
            <Text color="label" size="15pt" weight="heavy">
              My tokens
            </Text>
          </Inline>
        )}

        <ContextMenuButton
          menuItems={menuConfig.menuItems}
          menuTitle=""
          onPressMenuItem={handleSelectChain}
          onPressAndroid={onShowActionSheet}
          testID={`chain-selection-${output ? 'output' : 'input'}`}
        >
          <HitSlop space="10px">
            <Inline alignVertical="center" space="6px" wrap={false}>
              {output && (
                <ChainImage
                  chain={ethereumUtils.getNetworkFromChainId(SwapInputController.outputChainId.value ?? ChainId.mainnet)}
                  size={16}
                />
              )}
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
        </ContextMenuButton>
      </Inline>
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
