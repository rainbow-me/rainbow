import React, { useCallback, useMemo } from 'react';
import { ListRenderItem, StyleSheet, View } from 'react-native';
import { deviceUtils } from '@/utils';
import { useAccountSettings, useHiddenTokens, useShowcaseTokens } from '@/hooks';
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

// Constants for layout measurements
const COLLECTION_HEADER_HEIGHT = 60;
const NFT_CARD_SIZE = (deviceUtils.dimensions.width - 38 - 10) / 2;
const NFT_ITEM_HEIGHT = NFT_CARD_SIZE + 12;
const STAGGER_DELAY = 50;

type CollectiblesListItem = {
  type: 'header' | 'row';
  id: string;
  name: string;
  tokens?: UniqueAsset[];
  rowIndex?: number;
};

const keyExtractor = (item: CollectiblesListItem): string => {
  return `${item.type}-${item.id}`;
};

// Component to render a row of NFTs (2 side by side)
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

export function CollectiblesList() {
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
        const groups = groupBy(data.nfts, token => token.familyName);
        return Object.entries(groups)
          .filter(([_, tokens]) => !hiddenTokens.includes(tokens[0].fullUniqueId) && !showcaseTokens.includes(tokens[0].fullUniqueId))
          .map(([familyName, tokens]) => ({
            familyName,
            tokens,
          }))
          .filter(({ familyName }) => familyName);
      },
    },
  });

  const listData = useMemo(() => {
    if (!collections) return [];

    return collections.reduce<CollectiblesListItem[]>((acc, collection) => {
      // Add header
      acc.push({
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
        acc.push({
          type: 'row',
          id: `${collection.familyName}-row-${rowIndex}`,
          name: collection.familyName,
          tokens: tokenPair,
          rowIndex,
        });
      });

      return acc;
    }, []);
  }, [collections]);

  const renderItem: ListRenderItem<CollectiblesListItem> = useCallback(({ item }) => {
    if (item.type === 'header') {
      return <CollectionHeader name={item.name} />;
    }

    if (item.type === 'row' && item.tokens) {
      return <NFTRow tokens={item.tokens} collectionName={item.name} rowIndex={item.rowIndex ?? 0} />;
    }

    return null;
  }, []);

  const getItemLayout = useCallback((data: ArrayLike<CollectiblesListItem> | null | undefined, index: number) => {
    if (!data) return { length: 0, offset: 0, index };

    const items = Array.from(data);
    let offset = 0;

    for (let i = 0; i < index; i++) {
      const curr = items[i];
      if (curr.type === 'header') {
        offset += COLLECTION_HEADER_HEIGHT;
      } else if (curr.type === 'row') {
        offset += NFT_ITEM_HEIGHT + 12; // Include marginBottom
      }
    }

    const item = items[index];
    const length = item?.type === 'header' ? COLLECTION_HEADER_HEIGHT : NFT_ITEM_HEIGHT;

    return { length, offset, index };
  }, []);

  return (
    <Animated.FlatList
      data={listData}
      keyExtractor={keyExtractor}
      ListEmptyComponent={<EmptyCollectiblesList isLoading={isLoading} />}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      scrollEnabled={false}
      style={styles.flatList}
      showsVerticalScrollIndicator={false}
      windowSize={10}
    />
  );
}

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
