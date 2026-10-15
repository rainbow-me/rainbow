import { createBaseStore } from '@storesjs/stores';

import { type HyperliquidSymbol, type Token } from '@/features/charts/types';
import { type Exact } from '@/types/objects';

type ViewedTokenState = {
  token: Token | null;
  setToken: <T extends Token>(token: Exact<T, Exclude<Token, HyperliquidSymbol>>) => void;
};

/**
 * The token shown by the open asset detail screen: the expanded asset sheet or a perps market. Set on navigation, so
 * it is current before the screen mounts.
 */
export const useViewedTokenStore = createBaseStore<ViewedTokenState>(set => ({
  token: null,

  setToken: token =>
    set(state => {
      if (areTokensEqual(state.token, token)) return state;
      return { token };
    }),
}));

function areTokensEqual(previousToken: Token | null, newToken: Token | null): boolean {
  if (!previousToken && !newToken) return true;
  if (!previousToken || !newToken) return false;
  if (typeof previousToken === 'string' || typeof newToken === 'string') return previousToken === newToken;
  return previousToken.address === newToken.address && previousToken.chainId === newToken.chainId;
}
