import React, { useMemo, useRef } from 'react';
import { CarouselCard } from '../CarouselCard';
import { useRoute } from '@react-navigation/native';
import { IS_TEST } from '@/env';

import {
  TrimmedCard,
  useRemoteCardContext,
  RemoteCard,
} from '@/components/cards/remote-cards';
import { REMOTE_CARDS, getExperimetalFlag } from '@/config';
import { useDimensions, useWallets } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';
import { FlashList } from '@shopify/flash-list';

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

  const remoteCardsEnabled =
    getExperimetalFlag(REMOTE_CARDS) || config.remote_cards_enabled;
  const { getCardsForPlacement } = useRemoteCardContext();
  const { width } = useDimensions();

  const data = useMemo(() => getCardsForPlacement(name as string), [
    getCardsForPlacement,
    name,
  ]);

  const gutterSize = getGutterSizeForCardAmount(data.length);

  const _renderItem = ({ item }: RenderItemProps) => {
    return (
      <RemoteCard
        card={item}
        cards={data}
        gutterSize={gutterSize}
        carouselRef={carouselRef}
      />
    );
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
