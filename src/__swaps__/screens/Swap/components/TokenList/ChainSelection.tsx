import c from 'chroma-js';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import Animated, { AnimatedRef, SharedValue, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import * as i18n from '@/languages';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ChainId } from '@/state/backendNetworks/types';
import { opacity } from '@/__swaps__/utils/swaps';
import { analytics } from '@/analytics';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { AnimatedText, Bleed, Box, Inline, Text, TextIcon, globalColors, useColorMode } from '@/design-system';
import { useAccountAccentColor } from '@/hooks';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';
import { userAssetsStore, useUserAssetsStore } from '@/state/assets/userAssets';
import { swapsStore } from '@/state/swaps/swapsStore';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import Routes from '@/navigation/routesNames';
import { Navigation } from '@/navigation';
import { TokenToBuyListItem } from '@/__swaps__/types/search';
import { GestureHandlerButton } from '../GestureHandlerButton';
import { UserAssetFilter } from '@/__swaps__/types/assets';

type ChainSelectionProps = {
  animatedRef: AnimatedRef<Animated.FlatList<string>> | AnimatedRef<Animated.FlatList<TokenToBuyListItem>>;
  output: boolean;
  onNavigateToNetworkSelector?: () => void;
  onChainSelected: (chainId: ChainId | undefined) => void;
  selectedChainId: SharedValue<UserAssetFilter>;
};

const allText = i18n.t(i18n.l.exchange.all_networks);

export const ChainSelection = memo(function ChainSelection({
  animatedRef,
  output,
  onNavigateToNetworkSelector,
  onChainSelected,
  selectedChainId,
}: ChainSelectionProps) {
  const { isDarkMode } = useColorMode();
  const { accentColor: accountColor } = useAccountAccentColor();

  const chainLabels = useBackendNetworksStore(state => state.getChainsLabel());
  const swapSupportedChainIds = useBackendNetworksStore(state => state.getSwapSupportedChainIds());

  // chains sorted by balance on output, chains without balance hidden on input
  const balanceSortedChainList = useUserAssetsStore(state => (output ? state.getBalanceSortedChainList() : state.getChainsWithBalance()));

  // For output, use all swap-supported chains instead of just chains with balance
  const chainList = useMemo(() => {
    if (output) {
      // Include all swap-supported chains for output selection
      return swapSupportedChainIds;
    }
    return balanceSortedChainList;
  }, [output, swapSupportedChainIds, balanceSortedChainList]);

  // const [initialFilter] = useState(() => {
  //   const filter = useUserAssetsStore.getState().filter;
  //   return filter === 'all' ? undefined : filter;
  // });
  // const inputListFilter = useSharedValue<UserAssetFilter | undefined>(initialFilter);

  const accentColor = useMemo(() => {
    if (c.contrast(accountColor, isDarkMode ? '#191A1C' : globalColors.white100) < (isDarkMode ? 2.125 : 1.5)) {
      const shiftedColor = isDarkMode ? c(accountColor).brighten(1).saturate(0.5).css() : c(accountColor).darken(0.5).saturate(0.5).css();
      return shiftedColor;
    } else {
      return accountColor;
    }
  }, [accountColor, isDarkMode]);

  const chainName = useDerivedValue(() => {
    if (!selectedChainId) return '';
    if (selectedChainId.value === 'all') return allText;
    return chainLabels[selectedChainId.value];
    // return output
    //   ? chainLabels[selectedChainId.value]
    //   : !inputListFilter.value || inputListFilter.value === 'all'
    //     ? allText
    //     : chainLabels[inputListFilter.value];
  });

  const handleSelectChain = useCallback(
    (chainId: ChainId | undefined) => {
      animatedRef.current?.scrollToOffset({ animated: true, offset: 0 });
      // if (!output) {
      //   inputListFilter.value = chainId;
      // }
      onChainSelected(chainId);
    },
    [animatedRef, onChainSelected]
  );

  const navigateToNetworkSelector = useCallback(() => {
    onNavigateToNetworkSelector?.();

    Navigation.handleAction(Routes.NETWORK_SELECTOR, {
      allowedNetworks: chainList,
      canEdit: false,
      canSelectAllNetworks: !output,
      goBackOnSelect: true,
      // @ts-ignore: TODO (kane)
      selected: selectedChainId,
      // selected: selectedChainId,
      setSelected: handleSelectChain,
    });
  }, [chainList, handleSelectChain, onNavigateToNetworkSelector, output, selectedChainId]);

  return (
    <Box as={Animated.View} paddingBottom={output ? '8px' : { custom: 14 }} paddingHorizontal="20px">
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

        <GestureHandlerButton onPressJS={navigateToNetworkSelector} testID={`chain-selection-${output ? 'output' : 'input'}`}>
          <Box paddingVertical="6px" paddingLeft="16px" flexDirection="row" alignItems="center" justifyContent="center" gap={6}>
            {/* <ChainButtonIcon output={output} /> */}
            <AnimatedText color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
              {chainName}
            </AnimatedText>
            <Text align="center" color={isDarkMode ? 'labelTertiary' : 'labelSecondary'} size="icon 13px" weight="bold">
              􀆏
            </Text>
          </Box>
        </GestureHandlerButton>
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
