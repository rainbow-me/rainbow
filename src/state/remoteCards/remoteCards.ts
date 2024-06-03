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
  getCardPlacement: (id: string) => TrimmedCard['placement'];
  dismissCard: (id: string) => void;

  getCardsForScreen: (screen: keyof typeof Routes) => TrimmedCard[];
}

type RoutesWithIndex = typeof Routes & { [key: string]: string };

type RemoteCardsStateWithTransforms = Omit<Partial<RemoteCardsState>, 'cards' | 'cardsById'> & {
  cardsById: Array<string>;
  cards: Array<[string, TrimmedCard]>;
};

function serializeState(state: Partial<RemoteCardsState>, version?: number) {
  try {
    const transformedStateToPersist: RemoteCardsStateWithTransforms = {
      ...state,
      cardsById: state.cardsById ? Array.from(state.cardsById) : [],
      cards: state.cards ? Array.from(state.cards.entries()) : [],
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
      cardsByIdData = new Set(state.cardsById);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert userAssetIds from user assets storage'), { error });
    throw error;
  }

  let cardsData: Map<string, TrimmedCard> = new Map();
  try {
    if (state.cards.length) {
      cardsData = new Map(state.cards);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert userAssets from user assets storage'), { error });
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
          cardsData.set(card.cardKey as string, { ...existingCard, ...card });
        } else {
          cardsData.set(card.cardKey as string, card);
        }
      });

      console.log({ cardsData });

      set({
        cards: cardsData,
        cardsById: new Set(validCards.map(card => card.sys.id as string)),
      });
    },

    getCard: (id: string) => get().cards.get(id),
    getCardPlacement: (id: string) => {
      const card = get().getCard(id);

      if (!card || !card.placement) {
        return undefined;
      }

      const { placement } = card;

      return (Routes as RoutesWithIndex)[placement.toString()];
    },

    dismissCard: (id: string) =>
      set(state => {
        if (!state.cardsById.has(id)) {
          return state;
        }

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

        return {
          ...state,
          cards: new Map(state.cards.set(id, newCard)),
        };
      }),
    getCardsForScreen: (screen: keyof typeof Routes) => {
      console.log(
        screen,
        Array.from(get().cards.values())
          .filter(card => card.cardKey && get().getCardPlacement(card.sys.id) === screen)
          .sort((a, b) => {
            if (a.index === b.index) return 0;
            if (a.index === undefined || a.index === null) return 1;
            if (b.index === undefined || b.index === null) return -1;
            return a.index - b.index;
          })
      );
      return Array.from(get().cards.values())
        .filter(card => {
          const placement = get().getCardPlacement(card.sys.id);

          console.log(placement, screen);

          return placement === screen;
        })
        .sort((a, b) => {
          if (a.index === b.index) return 0;
          if (a.index === undefined || a.index === null) return 1;
          if (b.index === undefined || b.index === null) return -1;
          return a.index - b.index;
        });
    },
  }),
  {
    storageKey: 'remoteCardsStore',
    version: 1,
    serializer: serializeState,
    deserializer: deserializeState,
  }
);
