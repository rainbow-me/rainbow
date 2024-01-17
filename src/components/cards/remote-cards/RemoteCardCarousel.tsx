import React, { useMemo } from 'react';
import { CarouselCard } from '../CarouselCard';
import { useRoute } from '@react-navigation/native';
import { IS_TEST } from '@/env';

import {
  TrimmedCard,
  useRemoteCardContext,
  RemoteCard,
} from '@/components/cards/remote-cards';
import { REMOTE_CARDS, getExperimetalFlag } from '@/config';
import { useDimensions } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';

type RenderItemProps = {
  item: TrimmedCard;
  index: number;
};

export const RemoteCardCarousel = () => {
  const { name } = useRoute();
  const config = useRemoteConfig();

  const remoteCardsEnabled =
    getExperimetalFlag(REMOTE_CARDS) || config.remote_cards_enabled;
  const { getCardsForPlacement } = useRemoteCardContext();
  const { width } = useDimensions();

  const _renderItem = ({ item }: RenderItemProps) => {
    return <RemoteCard card={item} />;
  };

  const data = useMemo(() => getCardsForPlacement(name as string), [
    getCardsForPlacement,
    name,
  ]);

  if (IS_TEST || !remoteCardsEnabled || !data.length) {
    return null;
  }

  return (
    <CarouselCard
      data={data}
      carouselItem={{
        renderItem: _renderItem,
        keyExtractor: item => item.cardKey!,
        placeholder: null,
        width: width - 40,
        height: 88,
        padding: 16,
        verticalOverflow: 12,
      }}
    />
  );
};

export default RemoteCardCarousel;
