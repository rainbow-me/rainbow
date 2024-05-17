import { useTokenSearch } from '../resources/search';

export const VerifiedAssetsSync = () => {
  useTokenSearch({ list: 'verifiedAssets' });

  // useUserAssets(
  //   {
  //     address: currentAddress as Hex,
  //     currency: currentCurrency,
  //   },
  //   {
  //     select: data =>
  //       selectorFilterByUserChains({
  //         data,
  //         selector: selectUserAssetsList,
  //       }),
  //     onSuccess: data => {
  //       const searchQuery = userAssetsStore.getState().searchQuery.toLowerCase();
  //       const filter = userAssetsStore.getState().filter;

  //       const filteredUserAssetsById: UniqueId[] = [];
  //       const userAssets = new Map<UniqueId, ParsedSearchAsset>();
  //       data.forEach(asset => {
  //         if (filter === 'all' || asset.chainId === filter) {
  //           if (searchQuery) {
  //             const nameMatch = asset.name.toLowerCase().includes(searchQuery);
  //             const symbolMatch = asset.symbol.toLowerCase().startsWith(searchQuery);
  //             const addressMatch = asset.address.toLowerCase().startsWith(searchQuery);
  //             if (nameMatch || symbolMatch || addressMatch) {
  //               filteredUserAssetsById.push(asset.uniqueId);
  //             }
  //           } else {
  //             filteredUserAssetsById.push(asset.uniqueId);
  //           }
  //         }
  //         userAssets.set(asset.uniqueId, asset as ParsedSearchAsset);
  //       });

  //       userAssetsStore.setState({
  //         filteredUserAssetsById,
  //         userAssets,
  //       });
  //     },
  //   }
  // );

  return null;
};
