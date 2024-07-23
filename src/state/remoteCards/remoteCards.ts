import { RainbowError, logger } from '@/logger';
import Routes from '@/navigation/routesNames';
import { queryClient } from '@/react-query';
import { TrimmedCard, TrimmedCards, cardCollectionQueryKey } from '@/resources/cards/cardCollectionQuery';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type CardKey = string;

export interface RemoteCardsState {
  cardsById: Set<string>;
  cards: Map<string, TrimmedCard>;

  setCards: (cards: TrimmedCards) => void;

  getCard: (id: string) => TrimmedCard | undefined;
  getCardPlacement: (id: string) => TrimmedCard['placement'] | undefined;
  dismissCard: (id: string) => void;

  getCardIdsForScreen: (screen: keyof typeof Routes) => string[];
}

type RoutesWithIndex = typeof Routes & { [key: string]: string };

type RemoteCardsStateWithTransforms = Omit<Partial<RemoteCardsState>, 'cards' | 'cardsById'> & {
  cardsById: Array<string>;
  cards: Array<[string, TrimmedCard]>;
};

function serializeState(state: Partial<RemoteCardsState>, version?: number) {
  try {
    const validCards = Array.from(state.cards?.entries() ?? []).filter(([, card]) => card && card.sys && card.sys.id);

    if (state.cards && validCards.length < state.cards.size) {
      logger.error(new RainbowError('remoteCardsStore: filtered cards without sys.id during serialization'), {
        filteredCount: state.cards.size - validCards.length,
      });
    }

    const transformedStateToPersist: RemoteCardsStateWithTransforms = {
      ...state,
      cardsById: state.cardsById ? Array.from(state.cardsById) : [],
      cards: validCards,
    };

    return JSON.stringify({
      state: transformedStateToPersist,
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('Failed to serialize state for remote cards storage'), { error });
    throw error;
  }
}

function deserializeState(serializedState: string) {
  let parsedState: { state: RemoteCardsStateWithTransforms; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('Failed to parse serialized state from remote cards storage'), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let cardsByIdData = new Set<string>();
  try {
    if (state.cardsById.length) {
      cardsByIdData = new Set(state.cardsById.filter(id => typeof id === 'string' && id.length > 0));
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert cardsById from remote cards storage'), { error });
    throw error;
  }

  let cardsData: Map<string, TrimmedCard> = new Map();
  try {
    if (state.cards.length) {
      const validCards = state.cards.filter(([, card]) => card && card.sys && typeof card.sys.id === 'string');

      if (validCards.length < state.cards.length) {
        logger.error(new RainbowError('Filtered out cards without sys.id during deserialization'), {
          filteredCount: state.cards.length - validCards.length,
        });
      }

      cardsData = new Map(validCards);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert cards from remote cards storage'), { error });
    throw error;
  }

  return {
    state: {
      ...state,
      cardsById: cardsByIdData,
      cards: cardsData,
    },
    version,
  };
}

export const remoteCardsStore = createRainbowStore<RemoteCardsState>(
  (set, get) => ({
    cards: new Map<CardKey, TrimmedCard>(),
    cardsById: new Set<CardKey>(),

    setCards: (cards: TrimmedCards) => {
      const cardsData = new Map<CardKey, TrimmedCard>();
      const validCards = Object.values(cards).filter(card => card.sys.id);

      validCards.forEach(card => {
        const existingCard = get().getCard(card.sys.id as string);
        if (existingCard) {
          cardsData.set(card.sys.id, { ...existingCard, ...card });
        } else {
          cardsData.set(card.sys.id, card);
        }
      });

      set({
        cards: cardsData,
        cardsById: new Set(validCards.map(card => card.sys.id as string)),
      });
    },

    getCard: (id: string) => {
      const card = get().cards.get(id);
      return card && card.sys.id ? card : undefined;
    },

    getCardPlacement: (id: string) => {
      const card = get().getCard(id);
      if (!card || !card.sys.id || !card.placement) {
        return undefined;
      }

      return (Routes as RoutesWithIndex)[card.placement];
    },

    dismissCard: (id: string) =>
      set(state => {
        const card = get().getCard(id);
        if (!card) {
          return state;
        }

        const newCard = { ...card, dismissed: true };

        // NOTE: Also need to update the query data with
        queryClient.setQueryData(cardCollectionQueryKey, (oldData: TrimmedCards | undefined = {}) => {
          return {
            ...oldData,
            [id]: newCard,
          };
        });

        // NOTE: This is kinda a hack to immediately dismiss the card from the carousel and not have an empty space
        // it will be added back during the next fetch
        state.cardsById.delete(id);

        return {
          ...state,
          cards: new Map(state.cards.set(id, newCard)),
        };
      }),

    getCardIdsForScreen: (screen: keyof typeof Routes) => {
      return Array.from(get().cards.values())
        .filter(card => card.sys.id && get().getCardPlacement(card.sys.id) === screen && !card.dismissed)
        .sort((a, b) => {
          if (a.index === b.index) return 0;
          if (a.index === undefined || a.index === null) return 1;
          if (b.index === undefined || b.index === null) return -1;
          return a.index - b.index;
        })
        .map(card => card.sys.id)
        .filter((id): id is string => id !== undefined);
    },
  }),
  {
    storageKey: 'remoteCardsStore',
    version: 1,
    serializer: serializeState,
    deserializer: deserializeState,
  }
);
