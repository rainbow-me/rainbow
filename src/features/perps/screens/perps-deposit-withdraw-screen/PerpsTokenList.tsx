import { CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { opacity } from '@/__swaps__/utils/swaps';
import { AnimatedText, Bleed, Box, globalColors, Inline, Text, useColorMode } from '@/design-system';
import { useAccountAccentColor } from '@/hooks';
import i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import c from 'chroma-js';
import React, { memo, useCallback, useMemo } from 'react';
import { Text as RNText, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { DelayedMount } from '@/components/utilities/DelayedMount';
import { usePerpsDepositContext } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsDepositContext';
import { LegendList } from '@legendapp/list';
import { EXPANDED_INPUT_HEIGHT } from './constants';
import { safeAreaInsetValues } from '@/utils';
import { useAccountAddress } from '@/state/wallets/walletsStore';

type ChainSelectionProps = {
  onChainSelected: (chainId: ChainId | undefined) => void;
  selectedChainId: ChainId | undefined;
};

const allText = i18n.exchange.all_networks();

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
            {i18n.exchange.my_tokens()}
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

type PerpsTokenListProps = {
  onSelectToken?: (token: ParsedSearchAsset | null) => void;
};

export const PerpsTokenList = ({ onSelectToken }: PerpsTokenListProps) => {
  return (
    <DelayedMount delay="idle">
      <PerpsTokenListCore onSelectToken={onSelectToken} />
    </DelayedMount>
  );
};

const COIN_ROW_HEIGHT = 60;
const MemoizedCoinRow = memo(CoinRow);

const PerpsTokenListCore = ({ onSelectToken }: PerpsTokenListProps) => {
  const accountAddress = useAccountAddress();
  const { depositActions, useDepositStore } = usePerpsDepositContext();
  const selectedChainId = useDepositStore(state => state.listChainId);
  const userAssets = useUserAssetsStore(state => state.userAssets);
  const userAssetIds = useUserAssetsStore(state => state.getFilteredUserAssetIds());

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
      return <MemoizedCoinRow height={COIN_ROW_HEIGHT} onPress={handleSelectToken} output={false} uniqueIdOrAsset={item} />;
    },
    [handleSelectToken]
  );

  return (
    <Box style={styles.listContainer}>
      <Box paddingHorizontal="4px">
        <PerpsChainSelection selectedChainId={selectedChainId} onChainSelected={depositActions.setListChainId} />
      </Box>

      <LegendList
        ListFooterComponent={<View style={styles.listFooter} />}
        data={searchResults}
        estimatedItemSize={COIN_ROW_HEIGHT}
        key={accountAddress}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="always"
        maintainVisibleContentPosition={false}
        overScrollMode="always"
        recycleItems
        renderItem={renderItem}
        scrollIndicatorInsets={styles.scrollIndicatorInsets}
      />
    </Box>
  );
};

function keyExtractor(item: ParsedSearchAsset): string {
  return item.uniqueId;
}

const styles = StyleSheet.create({
  listContainer: {
    height: EXPANDED_INPUT_HEIGHT,
    width: DEVICE_WIDTH - 24,
  },
  listFooter: {
    height: 48,
    width: '100%',
  },
  scrollIndicatorInsets: {
    bottom: safeAreaInsetValues.bottom + 48,
    top: 0,
  },
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
