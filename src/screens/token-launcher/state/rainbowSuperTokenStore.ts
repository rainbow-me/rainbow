import { TokenLink, TokenLinks } from '@/graphql/__generated__/metadata';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export interface SuperToken {
  address: string;
  chainId: number;
  description?: string;
  imageUrl?: string;
  links?: TokenLinks;
  transactionHash?: string;
  color?: string;
  cachedAt?: number; // Timestamp when token was cached
}

type AddSuperTokenParams = Omit<SuperToken, 'links'> & {
  links?: {
    website?: string;
    x?: string;
    telegram?: string;
    farcaster?: string;
    discord?: string;
    other?: string;
  };
};

export type SuperTokenStoreState = {
  tokens: Record<string, SuperToken>;
  checkTokenExpiration: (token?: SuperToken) => SuperToken | undefined;
  getSuperToken: (address?: string, chainId?: number) => SuperToken | undefined;
  getSuperTokenByTransactionHash: (transactionHash?: string) => SuperToken | undefined;
  addSuperToken: (token: AddSuperTokenParams) => void;
  removeSuperToken: (address: string, chainId: number) => void;
};

export const getSuperTokenKey = (address: string, chainId: number): string => `${address.toLowerCase()}_${chainId}`;
// Cache expiration duration in milliseconds (30 minutes)
const TOKEN_CACHE_DURATION = 30 * 60 * 1000;
export const useSuperTokenStore = createRainbowStore<SuperTokenStoreState>(
  (set, get) => ({
    tokens: {},
    getSuperToken: (address?: string, chainId?: number) => {
      if (!address || !chainId) return undefined;
      const key = getSuperTokenKey(address, chainId);
      const token = get().tokens[key];
      return get().checkTokenExpiration(token);
    },
    getSuperTokenByTransactionHash: (transactionHash?: string) => {
      if (!transactionHash) return undefined;
      const token = Object.values(get().tokens).find(token => token.transactionHash === transactionHash);
      return get().checkTokenExpiration(token);
    },
    addSuperToken: (token: AddSuperTokenParams) => {
      const key = getSuperTokenKey(token.address, token.chainId);
      set(state => ({
        tokens: {
          ...state.tokens,
          [key]: {
            ...token,
            links: token.links ? formatSuperTokenLinks(token.links) : undefined,
            cachedAt: Date.now(), // Add timestamp when token is cached
          },
        },
      }));
    },
    checkTokenExpiration: (token?: SuperToken) => {
      if (!token) return undefined;
      const now = Date.now();
      if (token.cachedAt && now - token.cachedAt > TOKEN_CACHE_DURATION) {
        get().removeSuperToken(token.address, token.chainId);
        return undefined;
      }
      return token;
    },
    removeSuperToken: (address: string, chainId: number) => {
      const key = getSuperTokenKey(address, chainId);
      set(state => {
        const newTokens = { ...state.tokens };
        delete newTokens[key];
        return { tokens: newTokens };
      });
    },
  }),
  {
    version: 0,
    storageKey: 'superTokens',
  }
);

const formatSuperTokenLinks = (links: AddSuperTokenParams['links']): TokenLinks => {
  return Object.entries(links ?? {}).reduce(
    (acc, [key, value]) => {
      if (value) {
        let standardizedKey = key;
        let url;
        switch (key) {
          case 'x':
            url = xUsernameToUrl(value);
            standardizedKey = 'twitter';
            break;
          case 'telegram':
            url = telegramChannelToUrl(value);
            break;
          case 'farcaster':
            url = farcasterNameToUrl(value);
            break;
          case 'website':
            url = value;
            standardizedKey = 'homepage';
            break;
          default:
            url = value;
            break;
        }
        acc[standardizedKey as keyof TokenLinks] = {
          url,
        } as TokenLink;
      }
      return acc;
    },
    {} as Record<string, TokenLink>
  );
};

const xUsernameToUrl = (username: string) => {
  return `https://x.com/${username}`;
};

const telegramChannelToUrl = (channel: string) => {
  return `https://t.me/${channel}`;
};

const farcasterNameToUrl = (name: string) => {
  return `https://warpcast.com/${name}`;
};
