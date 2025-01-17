/* eslint-disable no-nested-ternary */
import * as i18n from '@/languages';
import c from 'chroma-js';
import React, { memo, useCallback, useMemo } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import Animated, { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ChainId } from '@/state/backendNetworks/types';
import { opacity } from '@/__swaps__/utils/swaps';
import { analyticsV2 } from '@/analytics';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { AnimatedText, Bleed, Box, Inline, Text, TextIcon, globalColors, useColorMode } from '@/design-system';
import { useAccountAccentColor } from '@/hooks';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';
import { userAssetsStore, useUserAssetsStore } from '@/state/assets/userAssets';
import { swapsStore } from '@/state/swaps/swapsStore';
import { getChainsBadgeWorklet, getChainsLabelWorklet, useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { DropdownMenu, MenuItem } from '@/components/DropdownMenu';

type ChainSelectionProps = {
  allText?: string;
  output: boolean;
};

export const ChainSelection = memo(function ChainSelection({ allText, output }: ChainSelectionProps) {
  const { isDarkMode } = useColorMode();
  const { accentColor: accountColor } = useAccountAccentColor();
  const { selectedOutputChainId, setSelectedOutputChainId } = useSwapContext();
  const backendNetworks = useBackendNetworksStore(state => state.backendNetworksSharedValue);

  // chains sorted by balance on output, chains without balance hidden on input
  const balanceSortedChainList = useUserAssetsStore(state => (output ? state.getBalanceSortedChainList() : state.getChainsWithBalance()));
  const filter = useUserAssetsStore(state => state.filter);

  const inputListFilter = useSharedValue(filter);

  const accentColor = useMemo(() => {
    if (c.contrast(accountColor, isDarkMode ? '#191A1C' : globalColors.white100) < (isDarkMode ? 2.125 : 1.5)) {
      const shiftedColor = isDarkMode ? c(accountColor).brighten(1).saturate(0.5).css() : c(accountColor).darken(0.5).saturate(0.5).css();
      return shiftedColor;
    } else {
      return accountColor;
    }
  }, [accountColor, isDarkMode]);

  const chainName = useDerivedValue(() => {
    const chainLabels = getChainsLabelWorklet(backendNetworks);

    return output
      ? chainLabels[selectedOutputChainId.value]
      : inputListFilter.value === 'all'
        ? allText
        : chainLabels[inputListFilter.value as ChainId];
  });

  const handleSelectChain = useCallback(
    (actionKey: string) => {
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
    let supportedChains: MenuItem<string>[] = [];
    supportedChains = balanceSortedChainList.map(chainId => {
      return {
        actionKey: `${chainId}`,
        actionTitle: getChainsLabelWorklet(backendNetworks)[chainId],
        icon: {
          iconType: 'REMOTE',
          iconValue: {
            uri: getChainsBadgeWorklet(backendNetworks)[chainId],
          },
        },
      };
    });

    if (!output) {
      supportedChains.unshift({
        actionKey: 'all',
        actionTitle: i18n.t(i18n.l.exchange.all_networks),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'globe',
        },
      });
    }

    return {
      menuItems: supportedChains,
    };
  }, [backendNetworks, balanceSortedChainList, output]);

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

        <DropdownMenu menuConfig={menuConfig} onPressMenuItem={handleSelectChain} testID={`chain-selection-${output ? 'output' : 'input'}`}>
          <Box paddingVertical="6px" paddingLeft="16px" flexDirection="row" alignItems="center" justifyContent="center" gap={6}>
            <ChainButtonIcon output={output} />
            <AnimatedText color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
              {chainName}
            </AnimatedText>
            <Text align="center" color={isDarkMode ? 'labelTertiary' : 'labelSecondary'} size="icon 13px" weight="bold">
              􀆏
            </Text>
          </Box>
        </DropdownMenu>
      </Inline>
    </Box>
  );
});

const ChainButtonIcon = ({ output }: { output: boolean | undefined }) => {
  const { selectedOutputChainId: animatedSelectedOutputChainId } = useSwapContext();

  const userAssetsFilter = useUserAssetsStore(state => (output ? undefined : state.filter));
  const selectedOutputChainId = useSharedValueState(animatedSelectedOutputChainId, { pauseSync: !output });

  return (
    <Bleed vertical="6px">
      {output ? (
        <ChainImage
          chainId={selectedOutputChainId ?? animatedSelectedOutputChainId.value ?? ChainId.mainnet}
          position="relative"
          size={16}
        />
      ) : userAssetsFilter && userAssetsFilter !== 'all' ? (
        <ChainImage chainId={userAssetsFilter} size={16} position="relative" />
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
