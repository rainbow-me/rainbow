import React, { useCallback, useMemo } from 'react';
import { ListRenderItem, StyleSheet, View } from 'react-native';
import { deviceUtils } from '@/utils';
import { useAccountSettings, useHiddenTokens, useShowcaseTokens, withPerformanceTracking } from '@/hooks';
import Animated, { useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { CollectionHeader } from './Collection/CollectionHeader';
import { useLegacyNFTs } from '@/resources/nfts';
import { useNftSort } from '@/hooks/useNFTsSortBy';
import { groupBy } from 'lodash';
import { EmptyCollectiblesList } from './EmptyCollectiblesList';
import { useCollectiblesContext } from './CollectiblesContext';
import { UniqueTokenCard } from '@/components/unique-token';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { UniqueAsset } from '@/entities';
import * as i18n from '@/languages';

// Constants for layout measurements
const NFT_CARD_SIZE = (deviceUtils.dimensions.width - 38 - 10) / 2;
const NFT_ITEM_HEIGHT = NFT_CARD_SIZE + 12;
const STAGGER_DELAY = 50;

type CollectiblesListItem = {
  type: 'header' | 'row';
  id: string;
  name: string;
  tokens?: UniqueAsset[];
  rowIndex?: number;
  isSpecialCollection?: boolean;
};

const keyExtractor = (item: CollectiblesListItem): string => {
  return `${item.type}-${item.id}`;
};

function NFTRow({ tokens, collectionName, rowIndex = 0 }: { tokens: UniqueAsset[]; collectionName: string; rowIndex: number }) {
  const { navigate } = useNavigation();
  const { openedCollections } = useCollectiblesContext();

  const handleNFTPress = useCallback(
    (token: UniqueAsset) => {
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: token,
        backgroundOpacity: 1,
        cornerRadius: 'device',
        external: false,
        springDamping: 1,
        topOffset: 0,
        transitionDuration: 0.25,
        type: 'unique_token',
      });
    },
    [navigate]
  );

  // Create animated styles that respond to collection open/close state
  const animatedStyle = useAnimatedStyle(() => {
    const isOpen = openedCollections.value[collectionName] ?? 0;

    // Calculate delay based on row index
    const itemDelay = isOpen ? rowIndex * STAGGER_DELAY : STAGGER_DELAY * 8 - rowIndex * STAGGER_DELAY;

    return {
      // Only animate height changes
      height: withDelay(itemDelay, withTiming(isOpen ? NFT_ITEM_HEIGHT : 0, TIMING_CONFIGS.fadeConfig)),
      marginBottom: withDelay(itemDelay, withTiming(isOpen ? 12 : 0, TIMING_CONFIGS.fadeConfig)),
    };
  });

  return (
    <Animated.View style={[styles.nftRow, animatedStyle]}>
      {tokens.map((token, index) => (
        <View key={token.fullUniqueId} style={index === 0 ? styles.leftItem : styles.rightItem}>
          <UniqueTokenCard item={token} onPress={() => handleNFTPress(token)} size={NFT_CARD_SIZE} />
        </View>
      ))}
    </Animated.View>
  );
}

function CollectiblesListComponent() {
  const { accountAddress } = useAccountSettings();
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();
  const { nftSort, nftSortDirection } = useNftSort();

  const { data: collections, isLoading } = useLegacyNFTs({
    address: accountAddress,
    sortBy: nftSort,
    sortDirection: nftSortDirection,
    config: {
      select(data) {
        return {
          nfts: data.nfts,
          collections: Object.entries(groupBy(data.nfts, token => token.familyName))
            .filter(([_, tokens]) => !hiddenTokens.includes(tokens[0].fullUniqueId) && !showcaseTokens.includes(tokens[0].fullUniqueId))
            .map(([familyName, tokens]) => ({
              familyName,
              tokens,
            }))
            .filter(({ familyName }) => familyName),
        };
      },
    },
  });

  const listData = useMemo(() => {
    if (!collections) return [];

    const result: CollectiblesListItem[] = [];

    // Add showcase collection if it has tokens (at the TOP)
    const showcaseNfts = collections.nfts.filter(token => showcaseTokens.includes(token.uniqueId));
    if (showcaseNfts.length > 0) {
      // Add showcase header
      result.push({
        type: 'header',
        id: 'showcase',
        name: i18n.t(i18n.l.account.tab_showcase),
        isSpecialCollection: true,
      });

      // Group showcase tokens into rows
      const showcaseRows: UniqueAsset[][] = [];
      for (let i = 0; i < showcaseNfts.length; i += 2) {
        const pair = showcaseNfts.slice(i, i + 2);
        showcaseRows.push(pair);
      }

      // Add showcase rows
      showcaseRows.forEach((tokenPair, rowIndex) => {
        result.push({
          type: 'row',
          id: `showcase-row-${rowIndex}`,
          name: i18n.t(i18n.l.account.tab_showcase),
          tokens: tokenPair,
          rowIndex,
          isSpecialCollection: true,
        });
      });
    }

    // Add regular collections (in the MIDDLE)
    collections.collections.forEach(collection => {
      // Add header
      result.push({
        type: 'header',
        id: collection.familyName,
        name: collection.familyName,
      });

      // Group tokens into pairs for the grid layout
      const rows: UniqueAsset[][] = [];
      for (let i = 0; i < collection.tokens.length; i += 2) {
        const pair = collection.tokens.slice(i, i + 2);
        rows.push(pair);
      }

      // Add rows to the list
      rows.forEach((tokenPair, rowIndex) => {
        result.push({
          type: 'row',
          id: `${collection.familyName}-row-${rowIndex}`,
          name: collection.familyName,
          tokens: tokenPair,
          rowIndex,
        });
      });
    });

    // Add hidden collection if it has tokens (at the BOTTOM)
    const hiddenNfts = collections.nfts.filter(token => hiddenTokens.includes(token.fullUniqueId));
    if (hiddenNfts.length > 0) {
      // Add hidden header
      result.push({
        type: 'header',
        id: 'hidden',
        name: i18n.t(i18n.l.button.hidden),
        isSpecialCollection: true,
      });

      // Group hidden tokens into rows
      const hiddenRows: UniqueAsset[][] = [];
      for (let i = 0; i < hiddenNfts.length; i += 2) {
        const pair = hiddenNfts.slice(i, i + 2);
        hiddenRows.push(pair);
      }

      // Add hidden rows
      hiddenRows.forEach((tokenPair, rowIndex) => {
        result.push({
          type: 'row',
          id: `hidden-row-${rowIndex}`,
          name: i18n.t(i18n.l.button.hidden),
          tokens: tokenPair,
          rowIndex,
          isSpecialCollection: true,
        });
      });
    }

    return result;
  }, [collections, showcaseTokens, hiddenTokens]);

  const renderItem: ListRenderItem<CollectiblesListItem> = useCallback(({ item }) => {
    if (item.type === 'header') {
      return <CollectionHeader name={item.name} isSpecialCollection={item.isSpecialCollection} />;
    }

    if (item.type === 'row' && item.tokens) {
      return <NFTRow tokens={item.tokens} collectionName={item.name} rowIndex={item.rowIndex ?? 0} />;
    }

    return null;
  }, []);

  if (isLoading) {
    return <EmptyCollectiblesList isLoading={true} />;
  }

  return (
    <Animated.FlatList
      data={listData}
      keyExtractor={keyExtractor}
      ListEmptyComponent={<EmptyCollectiblesList isLoading={false} />}
      renderItem={renderItem}
      scrollEnabled={false}
      style={styles.flatList}
      showsVerticalScrollIndicator={false}
      windowSize={10}
      initialNumToRender={20}
      removeClippedSubviews={false}
    />
  );
}

export const CollectiblesList = withPerformanceTracking(CollectiblesListComponent);

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
    width: deviceUtils.dimensions.width,
    paddingBottom: 12,
  },
  nftContainer: {
    width: NFT_CARD_SIZE,
    overflow: 'hidden',
  },
  nftRow: {
    width: deviceUtils.dimensions.width,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 19,
    overflow: 'hidden',
  },
  leftItem: {
    width: NFT_CARD_SIZE,
  },
  rightItem: {
    width: NFT_CARD_SIZE,
  },
});
