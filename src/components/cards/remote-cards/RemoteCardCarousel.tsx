import { IS_TEST } from '@/env';
import { useRoute } from '@react-navigation/native';
import React, { useRef } from 'react';
import { CarouselCard } from '../CarouselCard';

import { RemoteCard } from '@/components/cards/remote-cards';
import { REMOTE_CARDS, getExperimentalFlag } from '@/config';
import { Separator, useColorMode } from '@/design-system';
import { useDimensions } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';
import Routes from '@/navigation/routesNames';
import { remoteCardsStore } from '@/state/remoteCards/remoteCards';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { FlashList } from '@shopify/flash-list';

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

export const RemoteCardCarousel = React.memo(function RemoteCardCarousel() {
  const { isDarkMode } = useColorMode();
  const carouselRef = useRef<FlashList<string>>(null);
  const { name } = useRoute();
  const config = useRemoteConfig();
  const { width } = useDimensions();

  const remoteCardsEnabled = getExperimentalFlag(REMOTE_CARDS) || config.remote_cards_enabled;
  const cardIds = remoteCardsStore(state => state.getCardIdsForScreen(name as keyof typeof Routes));

  const gutterSize = getGutterSizeForCardAmount(cardIds.length);

  const _renderItem = ({ item }: RenderItemProps) => {
    return <RemoteCard id={item} gutterSize={gutterSize} carouselRef={carouselRef} />;
  };

  if (getIsReadOnlyWallet() || IS_TEST || !remoteCardsEnabled || !cardIds.length) {
    return null;
  }

  return (
    <>
      <Separator color={isDarkMode ? 'separatorSecondary' : 'separatorTertiary'} thickness={1} />
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
    </>
  );
});
