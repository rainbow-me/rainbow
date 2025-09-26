import { COIN_ROW_WITH_PADDING_HEIGHT, CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { opacity } from '@/__swaps__/utils/swaps';
import { AnimatedText, Bleed, Box, globalColors, Inline, Stack, Text, useColorMode } from '@/design-system';
import { useAccountAccentColor } from '@/hooks';
import { useDelayedMount } from '@/hooks/useDelayedMount';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import c from 'chroma-js';
import React, { memo, useCallback, useMemo } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { EXPANDED_INPUT_HEIGHT } from './constants';

type ChainSelectionProps = {
  onChainSelected: (chainId: ChainId | undefined) => void;
  selectedChainId: ChainId | undefined;
};

const allText = i18n.t(i18n.l.exchange.all_networks);

const PerpsChainSelection = memo(function ChainSelection({ onChainSelected, selectedChainId }: ChainSelectionProps) {
  const { isDarkMode } = useColorMode();
  const { accentColor: accountColor } = useAccountAccentColor();

  const chainLabels = useBackendNetworksStore(state => state.getChainsLabel());
  const balanceSortedChainList = useUserAssetsStore(state => state.getChainsWithBalance());

  const accentColor = useMemo(() => {
    if (c.contrast(accountColor, isDarkMode ? '#191A1C' : globalColors.white100) < (isDarkMode ? 2.125 : 1.5)) {
      const shiftedColor = isDarkMode ? c(accountColor).brighten(1).saturate(0.5).css() : c(accountColor).darken(0.5).saturate(0.5).css();
      return shiftedColor;
    } else {
      return accountColor;
    }
  }, [accountColor, isDarkMode]);

  const chainName = !selectedChainId ? allText : chainLabels[selectedChainId];

  const navigateToNetworkSelector = useCallback(() => {
    Navigation.handleAction(Routes.NETWORK_SELECTOR, {
      allowedNetworks: balanceSortedChainList,
      canEdit: false,
      canSelectAllNetworks: true,
      goBackOnSelect: true,
      selected: selectedChainId,
      setSelected: onChainSelected,
    });
  }, [balanceSortedChainList, onChainSelected, selectedChainId]);

  return (
    <Box as={Animated.View} paddingBottom={{ custom: 14 }} paddingHorizontal="20px">
      <Inline alignHorizontal="justify" alignVertical="center">
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

        <GestureHandlerButton onPressJS={navigateToNetworkSelector} testID="perps-chain-selection">
          <Box paddingVertical="6px" paddingLeft="16px" flexDirection="row" alignItems="center" justifyContent="center" gap={6}>
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

const getItemLayout = (_: unknown, index: number) => ({
  length: COIN_ROW_WITH_PADDING_HEIGHT,
  offset: COIN_ROW_WITH_PADDING_HEIGHT * index,
  index,
});

interface PerpsTokenListProps {
  onSelectToken?: (token: ParsedSearchAsset | null) => void;
  onSelectChain: (chainId: ChainId | undefined) => void;
  selectedChainId: ChainId | undefined;
}

const MemoizedCoinRow = memo(CoinRow);

const PerpsTokenListCore = ({ onSelectToken, onSelectChain, selectedChainId }: PerpsTokenListProps) => {
  const userAssetIds = useUserAssetsStore(state => state.getFilteredUserAssetIds());
  const userAssets = useUserAssetsStore(state => state.userAssets);

  const searchResults = useMemo(() => {
    return userAssetIds
      .map(id => userAssets.get(id))
      .filter((asset): asset is ParsedSearchAsset => asset != null && (selectedChainId ? asset.chainId === selectedChainId : true));
  }, [selectedChainId, userAssetIds, userAssets]);

  const handleSelectToken = useCallback(
    (token: ParsedSearchAsset | null) => {
      if (!token || !onSelectToken) return;
      onSelectToken(token);
    },
    [onSelectToken]
  );

  const renderItem = useCallback(
    ({ item }: { item: ParsedSearchAsset }) => {
      return <MemoizedCoinRow onPress={handleSelectToken} output={false} uniqueIdOrAsset={item} />;
    },
    [handleSelectToken]
  );

  return (
    <Box style={{ height: EXPANDED_INPUT_HEIGHT, width: DEVICE_WIDTH - 24 }}>
      <PerpsChainSelection selectedChainId={selectedChainId} onChainSelected={onSelectChain} />
      <FlatList
        key={selectedChainId ?? 'all'}
        contentContainerStyle={styles.contentContainer}
        data={searchResults}
        getItemLayout={getItemLayout}
        initialNumToRender={15}
        keyExtractor={item => item.uniqueId}
        keyboardShouldPersistTaps="always"
        maxToRenderPerBatch={8}
        renderItem={renderItem}
        windowSize={3}
      />
    </Box>
  );
};

export const PerpsTokenList = (props: PerpsTokenListProps) => {
  const shouldMount = useDelayedMount();

  if (!shouldMount) return null;

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <PerpsTokenListCore {...props} />;
};

const styles = StyleSheet.create({
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  contentContainer: {
    paddingBottom: 16,
  },
});
