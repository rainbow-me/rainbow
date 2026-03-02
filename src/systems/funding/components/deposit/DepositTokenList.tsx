import c from 'chroma-js';
import React, { memo, useCallback, useMemo } from 'react';
import { Keyboard, StyleSheet, Text as RNText } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { LegendList } from '@legendapp/list';
import { DelayedMount } from '@/components/utilities/DelayedMount';
import { NAVBAR_HEIGHT_WITH_PADDING } from '@/components/navbar/constants';
import { TokenSearchNotFound } from '@/components/token-search/TokenSearchNotFound';
import { AnimatedText, Bleed, Box, globalColors, Inline, Separator, Stack, Text, useColorMode } from '@/design-system';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { GestureHandlerButton } from '@/components/buttons/GestureHandlerButton';
import { type ParsedSearchAsset } from '@/__swaps__/types/assets';
import { opacity } from '@/framework/ui/utils/opacity';
import { TOKEN_SEARCH_FOCUSED_INPUT_HEIGHT } from '@/components/token-search/constants';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { EXPANDED_INPUT_HEIGHT, NavigationSteps } from '../../constants';
import { useDepositContext } from '../../contexts/DepositContext';
import { SearchInput } from './SearchInput';

// ============ Types ========================================================== //

type ChainSelectionProps = {
  onChainSelected: (chainId: ChainId | undefined) => void;
  selectedChainId: ChainId | undefined;
};

type DepositTokenListProps = {
  inputProgress: SharedValue<number>;
  onSelectToken?: (token: ParsedSearchAsset | null) => void;
};

// ============ Constants ====================================================== //

const COIN_ROW_HEIGHT = 60;
const allText = i18n.t(i18n.l.exchange.all_networks);

// ============ Chain Selection ================================================ //

const ChainSelection = memo(function ChainSelection({ onChainSelected, selectedChainId }: ChainSelectionProps) {
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
    Keyboard.dismiss();
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
    <Box as={Animated.View} paddingBottom={{ custom: 14 }} paddingHorizontal="20px" paddingTop="20px">
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

        <GestureHandlerButton onPressJS={navigateToNetworkSelector} testID="chain-selection">
          <Box alignItems="center" flexDirection="row" gap={6} justifyContent="center" paddingLeft="16px" paddingVertical="6px">
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

// ============ Token List ===================================================== //

export function DepositTokenList({ inputProgress, onSelectToken }: DepositTokenListProps) {
  return (
    <DelayedMount delay="idle">
      <DepositTokenListCore inputProgress={inputProgress} onSelectToken={onSelectToken} />
    </DelayedMount>
  );
}

const MemoizedCoinRow = memo(CoinRow);

function DepositTokenListCore({ inputProgress, onSelectToken }: DepositTokenListProps) {
  const accountAddress = useAccountAddress();
  const { depositActions, useDepositStore } = useDepositContext();
  const selectedChainId = useDepositStore(state => state.listChainId);
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
      return <MemoizedCoinRow height={COIN_ROW_HEIGHT} onPress={handleSelectToken} output={false} uniqueIdOrAsset={item} />;
    },
    [handleSelectToken]
  );

  const listFooterStyle = useAnimatedStyle(() => {
    const isSearchFocused = inputProgress.value === NavigationSteps.SEARCH_FOCUSED;
    const bottomPadding = isSearchFocused ? EXPANDED_INPUT_HEIGHT - TOKEN_SEARCH_FOCUSED_INPUT_HEIGHT + 16 : 0;
    return { height: bottomPadding };
  });

  return (
    <Box style={styles.listContainer}>
      <Stack space="20px">
        <SearchInput inputProgress={inputProgress} />
        <Separator color="separatorTertiary" thickness={1} />
      </Stack>

      <Box style={styles.listBody}>
        <Box paddingHorizontal="4px">
          <ChainSelection onChainSelected={depositActions.setListChainId} selectedChainId={selectedChainId} />
        </Box>

        <LegendList
          ListEmptyComponent={<ListEmptyComponent />}
          ListFooterComponent={<Animated.View style={[styles.listFooter, listFooterStyle]} />}
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
    </Box>
  );
}

function keyExtractor(item: ParsedSearchAsset): string {
  return item.uniqueId;
}

const ListEmptyComponent = memo(function ListEmptyComponent() {
  return (
    <Box justifyContent="center" alignItems="center" paddingTop="32px">
      <TokenSearchNotFound />
    </Box>
  );
});

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  listContainer: {
    width: DEVICE_WIDTH - 24,
  },
  listBody: {
    height: EXPANDED_INPUT_HEIGHT - NAVBAR_HEIGHT_WITH_PADDING,
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
