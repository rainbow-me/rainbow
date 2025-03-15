import React, { useCallback } from 'react';
import { ListRenderItem } from 'react-native';
import { deviceUtils } from '@/utils';
import { useAccountSettings, useHiddenTokens, useShowcaseTokens } from '@/hooks';
import Animated from 'react-native-reanimated';
import { CollectionHeader } from './Collection/CollectionHeader';
import { useLegacyNFTs } from '@/resources/nfts';
import { useNftSort } from '@/hooks/useNFTsSortBy';
import { groupBy } from 'lodash';

const keyExtractor = (collectionName: string): string => {
  return `collection-${collectionName}`;
};

// const ListEmptyComponent = memo(function ListEmptyComponent() {
//   const mainnetEthBalance = useUserAssetsStore(state => state.getNativeAssetForChain(ChainId.mainnet))?.balance.amount ?? 0;

//   if (isZero(mainnetEthBalance)) {
//     return (
//       <Inset horizontal="20px">
//         <Box paddingVertical="24px" alignItems="center" gap={12}>
//           <ReceiveAssetsCard />
//           <EthCard />
//           <RotatingLearnCard />
//           <Box paddingVertical="12px">
//             <DiscoverMoreButton />
//           </Box>
//         </Box>
//       </Inset>
//     );
//   }

//   return (
//     <>
//       {Array.from({ length: MAX_CONDENSED_ASSETS - 1 }, (_, index) => (
//         <AssetListItemSkeleton animated descendingOpacity index={index} key={`skeleton${index}`} />
//       ))}
//     </>
//   );
// });

export function CollectiblesList() {
  const { accountAddress } = useAccountSettings();
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();
  const { nftSort, nftSortDirection } = useNftSort();

  const { data: collectionNames } = useLegacyNFTs({
    address: accountAddress,
    sortBy: nftSort,
    sortDirection: nftSortDirection,
    config: {
      select(data) {
        const groups = groupBy(data.nfts, token => token.familyName);
        const filteredGroups = Object.values(groups)
          .filter(tokens => !hiddenTokens.includes(tokens[0].fullUniqueId) && !showcaseTokens.includes(tokens[0].fullUniqueId))
          .map(tokens => tokens[0].familyName)
          .filter(Boolean);

        return filteredGroups;
      },
    },
  });

  const renderItem: ListRenderItem<string> = useCallback(({ item }) => {
    return <CollectionHeader name={item} />;
  }, []);

  // if (totalAssets === 0) {
  //   return <ListEmptyComponent />;
  // }

  return (
    <Animated.FlatList
      data={collectionNames}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      keyboardShouldPersistTaps="always"
      scrollEnabled={false}
      style={[{ flex: 1, width: deviceUtils.dimensions.width, paddingBottom: 12 }]}
      showsVerticalScrollIndicator={false}
      windowSize={30}
    />
  );
}
