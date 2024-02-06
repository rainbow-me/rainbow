import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionResult } from '@/react-query';

import { arcClient } from '@/graphql';
import { Card, GetCardCollectionQuery } from '@/graphql/__generated__/arc';
import { pick } from 'lodash';
import { IS_PROD } from '@/env';
import * as ls from '@/storage';
import { useRemoteConfig } from '@/model/remoteConfig';
import { REMOTE_CARDS, useExperimentalFlag } from '@/config';

export const TRIMMED_CARD_KEYS = [
  'cardKey',
  'dismissable',
  'placement',
  'index',
  'backgroundColor',
  'accentColor',
  'padding',
  'imageIcon',
  'imageRadius',
  'title',
  'titleColor',
  'subtitle',
  'subtitleColor',
  'primaryButton',
] as const;

export type TrimmedCard = Pick<Card, (typeof TRIMMED_CARD_KEYS)[number]> & {
  sys: Pick<Card['sys'], 'id'>;
  imageCollection: {
    items: {
      url: string;
    }[];
  };
};

export type TrimmedCards = Record<string, TrimmedCard>;

// Set a default stale time of 60 seconds so we don't over-fetch
// (query will serve cached data & invalidate after 60s).
const defaultStaleTime = 60_000;

// ///////////////////////////////////////////////
// Query Key

export const cardCollectionQueryKey = createQueryKey('cardCollection', {}, { persisterVersion: 1 });

// ///////////////////////////////////////////////
// Query Function

function parseCardCollectionResponse(data: GetCardCollectionQuery) {
  const newCards = data.cardCollection?.items.reduce((acc, card) => {
    if (!card) return acc;

    if (IS_PROD) {
      const hasDismissed = ls.cards.get([card.sys.id]);
      if (hasDismissed) return acc;
    }

    const newCard: TrimmedCard = {
      ...pick(card, ...TRIMMED_CARD_KEYS),
      sys: pick(card.sys, 'id'),
      imageCollection: {
        items: (card.imageCollection?.items || []).map(item => ({
          url: item?.url ?? '',
        })),
      },
    };
    return {
      ...acc,
      [card.sys.id]: newCard,
    };
  }, {} as TrimmedCards);

  return newCards || {};
}

async function cardCollectionQueryFunction() {
  const data = await arcClient.getCardCollection();
  return parseCardCollectionResponse(data);
}

export type CardCollectionResult = QueryFunctionResult<typeof cardCollectionQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchCardCollection(config: QueryConfig<CardCollectionResult, Error, typeof cardCollectionQueryKey> = {}) {
  return await queryClient.prefetchQuery(cardCollectionQueryKey, cardCollectionQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchCardCollection() {
  return await queryClient.fetchQuery(cardCollectionQueryKey, cardCollectionQueryFunction, { staleTime: defaultStaleTime });
}

// ///////////////////////////////////////////////
// Query Hook

export function useCardCollectionQuery() {
  const { remote_cards_enabled: remoteFlag } = useRemoteConfig();
  const localFlag = useExperimentalFlag(REMOTE_CARDS);

  return useQuery(cardCollectionQueryKey, cardCollectionQueryFunction, {
    enabled: remoteFlag || localFlag,
    staleTime: defaultStaleTime,
    refetchInterval: 60_000,
  });
}
