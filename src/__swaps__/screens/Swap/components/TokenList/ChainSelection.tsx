import React, { memo, useCallback } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

import Animated, { useDerivedValue, type AnimatedRef } from 'react-native-reanimated';

import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { type TokenToBuyListItem } from '@/__swaps__/types/search';
import { analytics } from '@/analytics';
import { GestureHandlerButton } from '@/components/buttons/GestureHandlerButton';
import { AnimatedText, Bleed, Box, Inline, Text, TextIcon, useColorMode } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { ChainImage } from '@/features/network/components/ChainImage';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { userAssetsActions } from '@/state/assets/userAssets';
import { userAssetsSearchActions, useUserAssetsSearchStore } from '@/state/assets/userAssetsSearch';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { swapsStore } from '@/state/swaps/swapsStore';

type ChainSelectionProps = {
  allText?: string;
  animatedRef: AnimatedRef<Animated.FlatList<string>> | AnimatedRef<Animated.FlatList<TokenToBuyListItem>>;
  output: boolean;
};

export const ChainSelection = memo(function ChainSelection({ allText, animatedRef, output }: ChainSelectionProps) {
  const { isDarkMode } = useColorMode();
  const { accentColor } = useAccountAccentColor();
  const { inputSearchRef, outputSearchRef, selectedOutputChainId, setSelectedOutputChainId } = useSwapContext();

  const chainLabels = useBackendNetworksStore(s => s.getChainsLabel());
  const inputChainIdFilter = useStoreSharedValue(useUserAssetsSearchStore, s => s.chainIdFilter);

  const chainName = useDerivedValue(() => {
    return output
      ? chainLabels[selectedOutputChainId.value]
      : inputChainIdFilter.value === undefined
        ? allText
        : chainLabels[inputChainIdFilter.value];
  });

  const handleSelectChain = useCallback(
    (chainId: ChainId | undefined) => {
      animatedRef.current?.scrollToOffset({ animated: true, offset: 0 });

      if (output && chainId) {
        setSelectedOutputChainId(chainId);
      } else {
        userAssetsSearchActions.setChainIdFilter(chainId);
      }

      analytics.track(analytics.event.swapsChangedChainId, {
        inputAsset: swapsStore.getState().inputAsset,
        type: output ? 'output' : 'input',
        chainId,
      });
    },
    [animatedRef, output, setSelectedOutputChainId]
  );

  const navigateToNetworkSelector = useCallback(() => {
    if (output) outputSearchRef.current?.blur();
    else inputSearchRef.current?.blur();

    Navigation.handleAction(Routes.NETWORK_SELECTOR, {
      allowedNetworks: output ? userAssetsActions.getBalanceSortedChainList() : userAssetsActions.getChainsWithBalance(),
      canEdit: false,
      canSelectAllNetworks: !output,
      goBackOnSelect: true,
      selected: output ? selectedOutputChainId : userAssetsSearchActions.getChainIdFilter(),
      setSelected: handleSelectChain,
    });
  }, [handleSelectChain, inputSearchRef, output, outputSearchRef, selectedOutputChainId]);

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
                  <RNText style={isDarkMode ? [styles.textIconGlow, { textShadowColor: opacity(accentColor, 0.2) }] : undefined}>
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
            <ChainButtonIcon output={output} />
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

  const chainIdFilter = useUserAssetsSearchStore(s => s.chainIdFilter);
  const selectedOutputChainId = useSharedValueState(animatedSelectedOutputChainId, { pauseSync: !output });

  if (!output && chainIdFilter === undefined) return null;

  return (
    <Bleed vertical="6px">
      {output ? (
        <ChainImage chainId={selectedOutputChainId ?? animatedSelectedOutputChainId.value} position="relative" size={16} />
      ) : (
        <ChainImage chainId={chainIdFilter} size={16} position="relative" />
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
