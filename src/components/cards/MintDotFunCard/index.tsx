import React from 'react';
import { CarouselCard } from '../CarouselCard';
import { Cell, NFT_IMAGE_SIZE, Placeholder } from './Cell';
import { Menu } from './Menu';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

export const MintDotFunCard = () => {
  const { navigate } = useNavigation();
  return (
    <CarouselCard
      title="Mints"
      data={[{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]}
      carouselItem={{
        renderItem: () => <Cell />,
        keyExtractor: (item: any) => item.id,
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
