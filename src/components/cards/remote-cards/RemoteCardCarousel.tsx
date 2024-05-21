import React, { useMemo, useRef } from 'react';
import { CarouselCard } from '../CarouselCard';
import { useRoute } from '@react-navigation/native';
import { IS_TEST } from '@/env';

import { useRemoteCardContext, RemoteCard } from '@/components/cards/remote-cards';
import { REMOTE_CARDS, getExperimetalFlag } from '@/config';
import { useDimensions, useWallets } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';
import { FlashList } from '@shopify/flash-list';
import { TrimmedCard } from '@/resources/cards/cardCollectionQuery';

type RenderItemProps = {
  item: TrimmedCard;
  index: number;
};

const TEST_CARD = {
  cardKey: 'dapp_browser',
  dismissable: true,
  placement: 'DISCOVER_SCREEN',
  index: 1,
  backgroundColor: null,
  accentColor: '#00E7F3',
  padding: 16,
  imageIcon: '􀆪',
  imageRadius: 12,
  title: {
    ar_AR: 'تعرف على المتصفح',
    en_US: 'Meet the Onchain Browser',
    fr_FR: 'Rencontrez le Navigateur',
    hi_IN: 'ब्राउज़र से मिलें',
    id_ID: 'Kenali Peramban',
    ja_JP: 'ブラウザを紹介します',
    ko_KR: '브라우저를 만나보세요',
    pt_BR: 'Conheça o Navegador',
    ru_RU: 'Познакомьтесь с Браузером',
    th_TH: 'พบกับเบราว์เซอร์',
    tr_TR: 'Tarayıcıyla Tanışın',
    zh_CN: '认识浏览器',
    es_419: 'Conoce el Navegador',
  },
  titleColor: 'label',
  subtitle: {
    ar_AR: ' ',
    en_US: 'Explore Now',
    fr_FR: ' ',
    hi_IN: '',
    id_ID: ' ',
    ja_JP: '',
    ko_KR: ' ',
    pt_BR: ' ',
    ru_RU: ' ',
    th_TH: '',
    tr_TR: ' ',
    zh_CN: '',
    es_419: ' ',
  },
  subtitleColor: null,
  primaryButton: {
    text: {
      ar_AR: 'استكشاف',
      en_US: 'Explore',
      fr_FR: 'Explorer',
      hi_IN: 'अन्वेषण करें',
      id_ID: 'Jelajahi',
      ja_JP: '探検',
      ko_KR: '탐험하다',
      pt_BR: 'Explorar',
      ru_RU: 'Исследовать',
      th_TH: 'สำรวจ',
      tr_TR: 'Keşfet',
      zh_CN: '探索',
      es_419: 'Explorar',
    },
    props: {
      url: 'https://www.speedtracer.xyz',
    },
    route: 'DappBrowserScreen',
  },
  sys: {
    id: '4I9TTyNUh1QTNE2pS75VNj',
  },
  imageCollection: {
    items: [
      {
        url: 'https://images.ctfassets.net/f4kw6q9y1vhw/3zHYvA7dopcWBqdGx5wFpr/263120f28aff68de1ae524bc405138e0/nftv22.png',
      },
    ],
  },
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

  const remoteCardsEnabled = getExperimetalFlag(REMOTE_CARDS) || config.remote_cards_enabled;
  const { getCardsForPlacement } = useRemoteCardContext();
  const { width } = useDimensions();

  const data = useMemo(() => [...getCardsForPlacement(name as string), TEST_CARD], [getCardsForPlacement, name]);

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
