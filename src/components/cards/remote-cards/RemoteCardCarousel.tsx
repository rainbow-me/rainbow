import React, { useMemo, useRef } from 'react';
import { CarouselCard } from '../CarouselCard';
import { useRoute } from '@react-navigation/native';
import { IS_TEST } from '@/env';

import { RemoteCard } from '@/components/cards/remote-cards';
import { REMOTE_CARDS, getExperimetalFlag } from '@/config';
import { useDimensions, useWallets } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';
import { FlashList } from '@shopify/flash-list';
import { TrimmedCard } from '@/resources/cards/cardCollectionQuery';
import { remoteCardsStore } from '@/state/remoteCards/remoteCards';
import Routes from '@/navigation/routesNames';

type RenderItemProps = {
  item: TrimmedCard;
  index: number;
};

export const getGutterSizeForCardAmount = (amount: number) => {
  if (amount === 1) {
    return 40;
  }

  return 55;
};

export const RemoteCardCarousel = () => {
  const carouselRef = useRef<FlashList<TrimmedCard>>(null);
  const { name } = useRoute();
  const config = useRemoteConfig();
  const { isReadOnlyWallet } = useWallets();
  const { width } = useDimensions();

  const remoteCardsEnabled = getExperimetalFlag(REMOTE_CARDS) || config.remote_cards_enabled;
  const getCardsForScreen = remoteCardsStore(state => state.getCardsForScreen);
  // const cards = remoteCardsStore(state => state.cards);

  // console.log({
  //   name,
  //   remoteCardsEnabled,
  //   cards: Array.from(cards.values()),
  // });

  const data = useMemo(() => getCardsForScreen(name as keyof typeof Routes), [getCardsForScreen, name]);

  const gutterSize = getGutterSizeForCardAmount(data.length);

  const _renderItem = ({ item }: RenderItemProps) => {
    return <RemoteCard card={item} cards={data} gutterSize={gutterSize} carouselRef={carouselRef} />;
  };

  if (isReadOnlyWallet || IS_TEST || !remoteCardsEnabled || !data.length) {
    return null;
  }

  return (
    <CarouselCard
      key={name as string}
      data={data}
      carouselItem={{
        carouselRef,
        renderItem: _renderItem,
        keyExtractor: item => item.cardKey!,
        placeholder: null,
        width: width - gutterSize,
        height: 88,
        padding: 16,
        verticalOverflow: 12,
      }}
    />
  );
};

export default RemoteCardCarousel;
