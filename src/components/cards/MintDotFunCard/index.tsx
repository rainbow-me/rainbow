import React, { useEffect, useState } from 'react';
import { CarouselCard } from '../CarouselCard';
import { CollectionCell, NFT_IMAGE_SIZE, Placeholder } from './CollectionCell';
import { Menu } from './Menu';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import {
  mintableCollectionsQueryKey,
  useMintableCollections,
} from '@/resources/mintdotfun';
import { useAccountSettings } from '@/hooks';
import { MintableCollection } from '@/graphql/__generated__/arc';
import { queryClient } from '@/react-query';

export function MintDotFunCard() {
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { data } = useMintableCollections({
    walletAddress: accountAddress,
    chainId: 1,
  });

  const [canRefresh, setCanRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!canRefresh) {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        setCanRefresh(true);
      }, 30_000);
    }
  }, [canRefresh]);

  return (
    <CarouselCard
      title="Mints"
      data={data?.getMintableCollections.collections}
      carouselItem={{
        renderItem: ({ item }) => <CollectionCell collection={item} />,
        keyExtractor: (item: MintableCollection) =>
          item.contractAddress + item.chainId,
        placeholder: <Placeholder />,
        width: NFT_IMAGE_SIZE,
        height: 167,
        padding: 10,
      }}
      button={{
        text: 'View All Mints',
        style: 'fill',
        onPress: () => navigate(Routes.MINT_DOT_FUN_SHEET),
      }}
      menu={<Menu />}
      refresh={() => {
        setCanRefresh(false);
        queryClient.invalidateQueries(
          mintableCollectionsQueryKey({
            address: accountAddress,
          })
        );
      }}
      canRefresh={canRefresh}
      isRefreshing={isRefreshing}
    />
  );
}
