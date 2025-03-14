import { TokenLink, TokenLinks } from '@/graphql/__generated__/metadata';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { useStoreWithEqualityFn } from 'zustand/traditional';

export interface SuperToken {
  address: string;
  chainId: number;
  description?: string;
  imageUrl?: string;
  links?: TokenLinks;
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
  getSuperToken: (address?: string, chainId?: number) => SuperToken | undefined;
  addSuperToken: (token: AddSuperTokenParams) => void;
  removeSuperToken: (address: string, chainId: number) => void;
};

export const getSuperTokenKey = (address: string, chainId: number): string => `${address.toLowerCase()}_${chainId}`;

export const superTokenStore = createRainbowStore<SuperTokenStoreState>(
  (set, get) => ({
    tokens: {},
    getSuperToken: (address?: string, chainId?: number) => {
      if (!address || !chainId) return undefined;
      const key = getSuperTokenKey(address, chainId);
      return get().tokens[key];
    },
    addSuperToken: (token: AddSuperTokenParams) => {
      const key = getSuperTokenKey(token.address, token.chainId);
      set(state => ({
        tokens: {
          ...state.tokens,
          [key]: {
            ...token,
            links: token.links ? formatSuperTokenLinks(token.links) : undefined,
          },
        },
      }));
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

export const useSuperTokenStore = <T>(selector: (state: SuperTokenStoreState) => T) =>
  useStoreWithEqualityFn(superTokenStore, selector, Object.is);

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
