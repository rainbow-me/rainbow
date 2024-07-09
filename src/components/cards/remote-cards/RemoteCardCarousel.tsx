import React, { useRef } from 'react';
import { CarouselCard } from '../CarouselCard';
import { useRoute } from '@react-navigation/native';
import { IS_TEST } from '@/env';

import { RemoteCard } from '@/components/cards/remote-cards';
import { REMOTE_CARDS, getExperimetalFlag } from '@/config';
import { useDimensions, useWallets } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';
import { FlashList } from '@shopify/flash-list';
import { remoteCardsStore } from '@/state/remoteCards/remoteCards';
import Routes from '@/navigation/routesNames';

type RenderItemProps = {
  item: string;
  index: number;
};

export const getGutterSizeForCardAmount = (amount: number) => {
  if (amount === 1) {
    return 40;
  }

  return 55;
};

export const RemoteCardCarousel = () => {
  const carouselRef = useRef<FlashList<string>>(null);
  const { name } = useRoute();
  const config = useRemoteConfig();
  const { isReadOnlyWallet } = useWallets();
  const { width } = useDimensions();

  const remoteCardsEnabled = getExperimetalFlag(REMOTE_CARDS) || config.remote_cards_enabled;
  const cardIds = remoteCardsStore(state => state.getCardIdsForScreen(name as keyof typeof Routes));

  const gutterSize = getGutterSizeForCardAmount(cardIds.length);

  const _renderItem = ({ item }: RenderItemProps) => {
    return <RemoteCard id={item} gutterSize={gutterSize} carouselRef={carouselRef} />;
  };

  if (isReadOnlyWallet || IS_TEST || !remoteCardsEnabled || !cardIds.length) {
    return null;
  }

  return (
    <CarouselCard
      key={name as string}
      data={cardIds}
      carouselItem={{
        carouselRef,
        renderItem: _renderItem,
        keyExtractor: item => item,
        placeholder: null,
        width: width - gutterSize,
        height: 80,
        padding: 16,
        verticalOverflow: 12,
      }}
    />
  );
};

export default RemoteCardCarousel;
