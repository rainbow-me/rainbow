import { time } from '@/utils';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useUserAssetsStore } from '../assets/userAssets';

// route -> token id -> subscription count
type TokenSubscriptionCountByRoute = Record<string, Record<string, number>>;

// export interface TokenData {
//   price: string;
//   change24hPct: string;
//   change1hPct: string;
//   volume24h: string;
//   marketCap: string;
//   updatedAt: string;
//   valuation: {
//     allowed: boolean;
//     reason: string;
//   };
// }

export interface TokenData {
  price: string;
  change: {
    change5mPct: string;
    change1hPct: string;
    change4hPct: string;
    change12hPct: string;
    change24hPct: string;
  };
  // TODO: this not yet explicitly supported, definition might change
  market: {
    marketCap: string;
    volume: {
      '24h': string;
    };
  };
  valuation: {
    allowed: boolean;
    reason: string;
  };
  reliability: {
    metadata: {
      liquidityCap: string;
    };
    status: string;
  };
  updateTime: string;
}

export interface LiveTokensData {
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

type State = {
  subscribedTokensByRoute: TokenSubscriptionCountByRoute;
  tokens: LiveTokensData;
};

type Actions = {
  removeSubscribedTokens: ({ route, tokenIds }: UpdateSubscribedTokensParams) => void;
  addSubscribedTokens: ({ route, tokenIds }: UpdateSubscribedTokensParams) => void;
  clear: () => void;
};

type LiveTokensStore = State & Actions;

const initialState: State = {
  subscribedTokensByRoute: {},
  tokens: {},
};

// example response:
// {
//   "metadata": {
//     "currency": "USD",
//     "requestId": "req_1234567890abcdef",
//     "requestTime": "2025-06-12T14:30:00.123Z",
//     "responseTime": "2025-06-12T14:30:01.456Z",
//     "success": true,
//     "version": "v1.2.3"
//   },
//   "result": {
//     "eth:1": {
//       "change": {
//         "change12hPct": "-1.67",
//         "change1hPct": "-0.85",
//         "change24hPct": "3.45",
//         "change4hPct": "2.34",
//         "change5mPct": "0.12"
//       },
//       "price": "67234.52",
//       "reliability": {
//         "metadata": {
//           "liquidityCap": "50000000.00"
//         },
//         "status": "PRICE_RELIABILITY_STATUS_TRUSTED"
//       },
//       "updateTime": "2025-06-12T14:29:45.789Z"
//     }
//   }
// }

const fetchTokensData = async ({ subscribedTokensByRoute, activeRoute }: LiveTokensParams): Promise<LiveTokensData | null> => {
  const tokenIdsArray = Object.keys(subscribedTokensByRoute[activeRoute] || {});

  if (tokenIdsArray.length === 0) {
    return null;
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

  const tokens: LiveTokensData = {};
  const currency = 'USD';

  tokenIdsArray.forEach(id => {
    const basePrice = parseInt(id.substring(2, 5), 16) / 10 || 10;
    const fluctuation = (Math.random() - 0.1) * 0.5;
    const price = (basePrice + fluctuation * 1000).toFixed(2);
    const change24hPct = ((Math.random() > 0.5 ? -1 : 1) * (fluctuation * 50)).toFixed(2);
    const change1hPct = (fluctuation * 100).toFixed(2);
    const change12hPct = ((Math.random() > 0.5 ? -1 : 1) * (fluctuation * 40)).toFixed(2);
    const change4hPct = ((Math.random() > 0.5 ? -1 : 1) * (fluctuation * 30)).toFixed(2);
    const change5mPct = ((Math.random() > 0.5 ? -1 : 1) * (fluctuation * 20)).toFixed(2);

    tokens[id] = {
      price,
      change: {
        change24hPct,
        change1hPct,
        change12hPct,
        change4hPct,
        change5mPct,
      },
      market: {
        marketCap: (basePrice * 1000000 + fluctuation * 1000000).toFixed(2),
        volume: {
          '24h': (basePrice * 1000 + fluctuation * 1000).toFixed(2),
        },
      },
      updateTime: new Date().toISOString(),
      valuation: {
        allowed: true,
        reason: '',
      },
      reliability: {
        metadata: {
          liquidityCap: '50000000.00',
        },
        status: 'PRICE_RELIABILITY_STATUS_TRUSTED',
      },
    };
  });

  return tokens;
};

function updateUserAssetsStore(tokens: LiveTokensData) {
  useUserAssetsStore.getState().updateTokens(tokens);
}

export const useLiveTokensStore = createQueryStore<LiveTokensData | null, LiveTokensParams, LiveTokensStore>(
  {
    fetcher: fetchTokensData,
    disableCache: true,
    staleTime: time.seconds(5),
    setData: ({ data, set }) => {
      if (data) {
        set(state => {
          updateUserAssetsStore(data);
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
    },
  },

  set => ({
    ...initialState,
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
          subscribedTokensByRoute,
        };
      });
    },

    clear() {
      set({ ...initialState });
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
