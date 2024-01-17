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
import { useDimensions, useWallets } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';

type RenderItemProps = {
  item: TrimmedCard;
  index: number;
};

export const getGutterSizeForCardAmount = (amount: number) => {
  if (amount === 1) {
    return 40;
  }

  return 80;
};

export const RemoteCardCarousel = () => {
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
    return <RemoteCard card={item} gutterSize={gutterSize} />;
  };

  if (isReadOnlyWallet || IS_TEST || !remoteCardsEnabled || !data.length) {
    return null;
  }

  return (
    <CarouselCard
      data={data}
      carouselItem={{
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
