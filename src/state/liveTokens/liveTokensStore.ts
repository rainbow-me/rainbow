import { time } from '@/utils';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';

// route -> token id -> subscription count
type TokenSubscriptionCountByRoute = Record<string, Record<string, number>>;

export interface TokenData {
  price: string;
  volume24h: string;
  priceChange24h: string;
  lastUpdated: number;
}

interface TokensDataResponse {
  [tokenId: string]: TokenData;
}

type LiveTokensParams = {
  subscribedTokensByRoute: TokenSubscriptionCountByRoute;
  activeRoute: string;
};

type UpdateSubscribedTokensParams = {
  route: string;
  tokenIds: string[];
};

interface LiveTokensStore {
  subscribedTokensByRoute: TokenSubscriptionCountByRoute;
  tokens: TokensDataResponse;
  addSubscribedTokens: ({ route, tokenIds }: UpdateSubscribedTokensParams) => void;
  removeSubscribedTokens: ({ route, tokenIds }: UpdateSubscribedTokensParams) => void;
  clear: () => void;
}

// let fetchCount = 0;

const fetchTokensData = async ({ subscribedTokensByRoute, activeRoute }: LiveTokensParams): Promise<TokensDataResponse | null> => {
  const tokenIdsArray = Object.keys(subscribedTokensByRoute[activeRoute] || {});

  if (tokenIdsArray.length === 0) {
    return null;
  }

  // fetchCount += 1;
  // console.log(`[liveTokensStore] Fetching tokens data: ${fetchCount}`);
  // console.log('[liveTokensStore] fetching tokens ', tokenIdsArray);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

  const assets: TokensDataResponse = {};
  tokenIdsArray.forEach(id => {
    const basePrice = parseInt(id.substring(2, 5), 16) / 10 || 10;
    const fluctuation = (Math.random() - 0.1) * 0.5;
    assets[id] = {
      price: (basePrice + fluctuation).toFixed(2),
      priceChange24h: (fluctuation * 100).toFixed(2),
      volume24h: (basePrice * 1000 + fluctuation * 1000).toFixed(2),
      lastUpdated: Date.now(),
    };
  });

  return assets;
};

export const useLiveTokensStore = createQueryStore<TokensDataResponse | null, LiveTokensParams, LiveTokensStore>(
  {
    fetcher: fetchTokensData,
    disableCache: true,
    staleTime: time.seconds(5),
    setData: ({ data, set }) => {
      if (data) {
        set(state => {
          return {
            ...state,
            tokens: { ...state.tokens, ...data },
          };
        });
      }
    },
    paramChangeThrottle: 250,
    params: {
      subscribedTokensByRoute: ($, store) => $(store).subscribedTokensByRoute,
      activeRoute: $ => $(useNavigationStore).activeRoute,
      // testParam: ($, store) =>
      //   $(useNavigationStore, state => {
      //     console.log('test state -', store.getState().test);
      //     const newQuery = state.searchQuery.trim();
      //     console.log('search query -', newQuery);
      //     return newQuery;
      //   }),
    },
  },

  set => ({
    subscribedTokensByRoute: {},
    tokens: {},

    addSubscribedTokens({ route, tokenIds }: UpdateSubscribedTokensParams) {
      set(state => {
        const { subscribedTokensByRoute } = state;

        // TODO: deduplicate tokenUniqueIds, remove tokens where we only need to fetch the mainnet price
        let hasChanges = false;

        if (!subscribedTokensByRoute[route]) {
          subscribedTokensByRoute[route] = {};
        }

        for (const tokenId of tokenIds) {
          if (!subscribedTokensByRoute[route][tokenId]) {
            subscribedTokensByRoute[route][tokenId] = (subscribedTokensByRoute[route][tokenId] ?? 0) + 1;
            hasChanges = true;
          }
        }

        if (!hasChanges) return state;

        return {
          ...state,
          subscribedTokensByRoute,
        };
      });
    },

    removeSubscribedTokens({ route, tokenIds }: UpdateSubscribedTokensParams) {
      set(state => {
        const { subscribedTokensByRoute } = state;

        let hasChanges = false;
        for (const tokenId of tokenIds) {
          if (subscribedTokensByRoute[route]?.[tokenId]) {
            subscribedTokensByRoute[route][tokenId] -= 1;
            if (subscribedTokensByRoute[route][tokenId] === 0) {
              delete subscribedTokensByRoute[route][tokenId];
            }
            hasChanges = true;
          }
        }

        if (!hasChanges) return state;

        // remove routes with no subscriptions
        if (Object.keys(subscribedTokensByRoute[route]).length === 0) {
          delete subscribedTokensByRoute[route];
        }

        return {
          ...state,
          subscribedTokensByRoute,
        };
      });
    },

    clear() {
      set({
        subscribedTokensByRoute: {},
        tokens: {},
      });
    },
  })
);

export function addSubscribedToken({ route, tokenId }: { route: string; tokenId: string }) {
  useLiveTokensStore.getState().addSubscribedTokens({ route, tokenIds: [tokenId] });
}
export function removeSubscribedToken({ route, tokenId }: { route: string; tokenId: string }) {
  useLiveTokensStore.getState().removeSubscribedTokens({ route, tokenIds: [tokenId] });
}

export const { addSubscribedTokens, removeSubscribedTokens } = useLiveTokensStore.getState();
