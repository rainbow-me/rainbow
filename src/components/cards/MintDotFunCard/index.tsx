import React from 'react';
import { CarouselCard } from '../CarouselCard';
import { Cell, NFT_IMAGE_SIZE, Placeholder } from './Cell';
import { Menu } from './Menu';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useMintableCollections } from '@/resources/mints';
import { useAccountSettings } from '@/hooks';
import { MintableCollection } from '@/graphql/__generated__/arc';

export const MintDotFunCard = () => {
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { data } = useMintableCollections({
    walletAddress: accountAddress,
    chainId: 1,
  });

  return (
    <CarouselCard
      title="Mints"
      data={data?.getMintableCollections?.collections}
      carouselItem={{
        renderItem: ({ item }) => <Cell mintableCollection={item} />,
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
    />
  );
};
