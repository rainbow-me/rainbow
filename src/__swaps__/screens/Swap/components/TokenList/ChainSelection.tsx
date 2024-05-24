/* eslint-disable no-nested-ternary */
/* eslint-disable react/jsx-props-no-spreading */
import c from 'chroma-js';
import * as i18n from '@/languages';
import { Text as RNText, StyleSheet } from 'react-native';
import Animated, { runOnUI, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import React, { useCallback, useMemo } from 'react';

import { SUPPORTED_CHAINS } from '@/references';
import { AnimatedText, Bleed, Box, HitSlop, Inline, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import {
  chainNameForChainIdWithMainnetSubstitution,
  chainNameForChainIdWithMainnetSubstitutionWorklet,
  chainNameFromChainIdWorklet,
} from '@/__swaps__/utils/chains';
import { opacity } from '@/__swaps__/utils/swaps';
import { ethereumUtils, showActionSheetWithOptions } from '@/utils';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId, ChainName } from '@/__swaps__/types/chains';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ContextMenuButton } from '@/components/context-menu';
import { useAccountAccentColor } from '@/hooks';
import { OnPressMenuItemEventObject } from 'react-native-ios-context-menu';
import { swapsStore } from '@/state/swaps/swapsStore';

type ChainSelectionProps = {
  allText?: string;
  output: boolean;
};

export const ChainSelection = ({ allText, output }: ChainSelectionProps) => {
  const { isDarkMode } = useColorMode();
  const { accentColor: accountColor } = useAccountAccentColor();
  const { selectedOutputChainId, setSelectedOutputChainId } = useSwapContext();
  const red = useForegroundColor('red');

  const initialFilter = useMemo(() => {
    return swapsStore.getState().filter;
  }, []);

  const accentColor = useMemo(() => {
    if (c.contrast(accountColor, isDarkMode ? '#191A1C' : globalColors.white100) < (isDarkMode ? 2.125 : 1.5)) {
      const shiftedColor = isDarkMode ? c(accountColor).brighten(1).saturate(0.5).css() : c(accountColor).darken(0.5).saturate(0.5).css();
      return shiftedColor;
    } else {
      return accountColor;
    }
  }, [accountColor, isDarkMode]);

  const chainName = useSharedValue(
    output
      ? chainNameFromChainIdWorklet(selectedOutputChainId.value)
      : initialFilter === 'all'
        ? allText
        : chainNameFromChainIdWorklet(initialFilter as ChainId)
  );

  useAnimatedReaction(
    () => ({
      outputChainId: selectedOutputChainId.value,
    }),
    current => {
      if (output) {
        chainName.value = chainNameForChainIdWithMainnetSubstitutionWorklet(current.outputChainId);
      }
    }
  );

  const handleSelectChain = useCallback(
    ({ nativeEvent: { actionKey } }: Omit<OnPressMenuItemEventObject, 'isUsingActionSheetFallback'>) => {
      if (output) {
        setSelectedOutputChainId(Number(actionKey) as ChainId);
      } else {
        swapsStore.setState({
          filter: actionKey === 'all' ? 'all' : (Number(actionKey) as ChainId),
        });
        runOnUI(() => {
          chainName.value = actionKey === 'all' ? allText : chainNameForChainIdWithMainnetSubstitutionWorklet(Number(actionKey) as ChainId);
        });
      }
    },
    [allText, chainName, output, selectedOutputChainId]
  );

  const menuConfig = useMemo(() => {
    const supportedChains = SUPPORTED_CHAINS({ testnetMode: false }).map(chain => {
      const title = chainNameForChainIdWithMainnetSubstitution(chain.id);

      return {
        actionKey: `${chain.id}`,
        actionTitle: title.charAt(0).toUpperCase() + title.slice(1),
        icon: {
          iconType: 'ASSET',
          iconValue: `${title}Badge${isDarkMode ? 'Dark' : ''}`,
        },
      };
    });

    if (!output) {
      supportedChains.unshift({
        actionKey: 'all',
        actionTitle: i18n.t(i18n.l.exchange.all_networks) as ChainName,
        icon: {
          iconType: 'icon',
          iconValue: '􀆪',
        },
      });
    }

    return {
      menuItems: supportedChains,
    };
  }, [isDarkMode, output]);

  const onShowActionSheet = useCallback(() => {
    const chainTitles = menuConfig.menuItems.map(chain => chain.actionTitle);

    if (!output) {
      chainTitles.unshift(i18n.t(i18n.l.exchange.all_networks) as ChainName);
    }

    showActionSheetWithOptions(
      {
        options: chainTitles,
        showSeparators: true,
      },
      (index: number) => {
        handleSelectChain({
          nativeEvent: { actionKey: menuConfig.menuItems[index].actionKey, actionTitle: '' },
        });
      }
    );
  }, [handleSelectChain, menuConfig.menuItems, output]);

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
              {i18n.t(i18n.l.exchange.filter_by_network)}
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
              {i18n.t(i18n.l.exchange.my_tokens)}
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
              {/* TODO: We need to add some ethereum utils to handle worklet functions */}
              {output && (
                <ChainImage chain={ethereumUtils.getNetworkFromChainId(selectedOutputChainId.value ?? ChainId.mainnet)} size={16} />
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
