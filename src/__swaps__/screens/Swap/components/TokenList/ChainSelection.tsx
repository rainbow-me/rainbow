/* eslint-disable no-nested-ternary */
import c from 'chroma-js';
import * as i18n from '@/languages';
import { Text as RNText, StyleSheet } from 'react-native';
import Animated, { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import React, { memo, useCallback, useMemo } from 'react';

import { AnimatedText, Bleed, Box, Inline, Text, TextIcon, globalColors, useColorMode } from '@/design-system';
import { opacity } from '@/__swaps__/utils/swaps';
import { ethereumUtils, showActionSheetWithOptions } from '@/utils';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId, ChainName, ChainNameDisplay } from '@/__swaps__/types/chains';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ContextMenuButton } from '@/components/context-menu';
import { useAccountAccentColor } from '@/hooks';
import { OnPressMenuItemEventObject } from 'react-native-ios-context-menu';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';
import { chainNameForChainIdWithMainnetSubstitution } from '@/__swaps__/utils/chains';
import { analyticsV2 } from '@/analytics';
import { swapsStore } from '@/state/swaps/swapsStore';

type ChainSelectionProps = {
  allText?: string;
  output: boolean;
};

export const ChainSelection = memo(function ChainSelection({ allText, output }: ChainSelectionProps) {
  const { isDarkMode } = useColorMode();
  const { accentColor: accountColor } = useAccountAccentColor();
  const { selectedOutputChainId, setSelectedOutputChainId } = useSwapContext();

  const balanceSortedChainList = userAssetsStore.getState().getBalanceSortedChainList();
  const inputListFilter = useSharedValue(userAssetsStore.getState().filter);

  const accentColor = useMemo(() => {
    if (c.contrast(accountColor, isDarkMode ? '#191A1C' : globalColors.white100) < (isDarkMode ? 2.125 : 1.5)) {
      const shiftedColor = isDarkMode ? c(accountColor).brighten(1).saturate(0.5).css() : c(accountColor).darken(0.5).saturate(0.5).css();
      return shiftedColor;
    } else {
      return accountColor;
    }
  }, [accountColor, isDarkMode]);

  const chainName = useDerivedValue(() => {
    return output
      ? ChainNameDisplay[selectedOutputChainId.value]
      : inputListFilter.value === 'all'
        ? allText
        : ChainNameDisplay[inputListFilter.value as ChainId];
  });

  const handleSelectChain = useCallback(
    ({ nativeEvent: { actionKey } }: Omit<OnPressMenuItemEventObject, 'isUsingActionSheetFallback'>) => {
      analyticsV2.track(analyticsV2.event.swapsChangedChainId, {
        inputAsset: swapsStore.getState().inputAsset,
        type: output ? 'output' : 'input',
        chainId: Number(actionKey) as ChainId,
      });

      if (output) {
        setSelectedOutputChainId(Number(actionKey) as ChainId);
      } else {
        inputListFilter.value = actionKey === 'all' ? 'all' : (Number(actionKey) as ChainId);
        userAssetsStore.setState({
          filter: actionKey === 'all' ? 'all' : (Number(actionKey) as ChainId),
        });
      }
    },
    [inputListFilter, output, setSelectedOutputChainId]
  );

  const menuConfig = useMemo(() => {
    const supportedChains = balanceSortedChainList.map(chainId => {
      const networkName = chainNameForChainIdWithMainnetSubstitution(chainId);
      const displayName = ChainNameDisplay[chainId];

      return {
        actionKey: `${chainId}`,
        actionTitle: displayName,
        icon: {
          iconType: 'ASSET',
          iconValue: `${networkName}Badge${chainId === ChainId.mainnet ? '' : 'NoShadow'}`,
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
  }, [balanceSortedChainList, output]);

  const onShowActionSheet = useCallback(() => {
    const chainTitles = menuConfig.menuItems.map(chain => chain.actionTitle);

    showActionSheetWithOptions(
      {
        options: chainTitles,
        showSeparators: true,
      },
      (index: number | undefined) => {
        // NOTE: When they click away from the menu, the index is undefined
        if (typeof index === 'undefined') return;
        handleSelectChain({
          nativeEvent: { actionKey: menuConfig.menuItems[index].actionKey, actionTitle: '' },
        });
      }
    );
  }, [handleSelectChain, menuConfig.menuItems]);

  return (
    <Box as={Animated.View} paddingBottom={output ? '8px' : { custom: 14 }} paddingHorizontal="20px" paddingTop="20px">
      <Inline alignHorizontal="justify" alignVertical="center">
        {output ? (
          <Inline alignVertical="center" space="6px">
            <TextIcon color="labelSecondary" size="icon 13px" weight="heavy" width={16}>
              􀆪
            </TextIcon>
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
          hitSlop={20}
          menuItems={menuConfig.menuItems}
          menuTitle=""
          onPressMenuItem={handleSelectChain}
          onPressAndroid={onShowActionSheet}
          testID={`chain-selection-${output ? 'output' : 'input'}`}
        >
          <Inline alignVertical="center" space="6px" wrap={false}>
            {/* TODO: We need to add some ethereum utils to handle worklet functions */}
            <ChainButtonIcon output={output} />
            <AnimatedText color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
              {chainName}
            </AnimatedText>
            <Text align="center" color={isDarkMode ? 'labelTertiary' : 'labelSecondary'} size="icon 13px" weight="bold">
              􀆏
            </Text>
          </Inline>
        </ContextMenuButton>
      </Inline>
    </Box>
  );
});

const ChainButtonIcon = ({ output }: { output: boolean | undefined }) => {
  const { selectedOutputChainId: animatedSelectedOutputChainId } = useSwapContext();

  const userAssetsFilter = userAssetsStore(state => (output ? undefined : state.filter));
  const selectedOutputChainId = useSharedValueState(animatedSelectedOutputChainId, { pauseSync: !output });

  return (
    <Bleed vertical="6px">
      {output ? (
        <ChainImage
          chain={ethereumUtils.getNetworkFromChainId(selectedOutputChainId ?? animatedSelectedOutputChainId.value ?? ChainId.mainnet)}
          size={16}
        />
      ) : userAssetsFilter && userAssetsFilter !== 'all' ? (
        <ChainImage chain={ethereumUtils.getNetworkFromChainId(userAssetsFilter)} size={16} />
      ) : (
        <></>
      )}
    </Bleed>
  );
};

export const styles = StyleSheet.create({
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
