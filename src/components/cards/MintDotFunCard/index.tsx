import React from 'react';
import { CarouselCard } from '../CarouselCard';
import { CELL_HORIZONTAL_PADDING, Mint, NFT_IMAGE_SIZE } from './Mint';
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
        renderItem: () => <Mint />,
        keyExtractor: (item: any) => item.id,
        placeholder: <></>,
        width: NFT_IMAGE_SIZE + CELL_HORIZONTAL_PADDING * 2,
        height: 167,
        spaceBetween: CELL_HORIZONTAL_PADDING * 2,
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
