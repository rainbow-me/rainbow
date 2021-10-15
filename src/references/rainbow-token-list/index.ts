import { keyBy } from 'lodash';
import RAINBOW_TOKEN_LIST_DATA from './rainbow-token-list.json';
import { RainbowToken } from '@rainbow-me/entities';

const tokenList: RainbowToken[] = RAINBOW_TOKEN_LIST_DATA.tokens.map(token => {
  const { address: rawAddress, decimals, name, symbol, extensions } = token;
  const address = rawAddress.toLowerCase();
  return {
    address,
    decimals,
    name,
    symbol,
    uniqueId: address,
    ...extensions,
  };
});

const ethWithAddress: RainbowToken = {
  address: 'eth',
  decimals: 18,
  isRainbowCurated: true,
  isVerified: true,
  name: 'Ethereum',
  symbol: 'ETH',
  uniqueId: 'eth',
};

const tokenListWithEth: RainbowToken[] = [ethWithAddress, ...tokenList];

export const RAINBOW_TOKEN_LIST: Record<string, RainbowToken> = keyBy(
  tokenListWithEth,
  'address'
);

const curatedRainbowTokenList: RainbowToken[] = tokenListWithEth.filter(
  t => t.isRainbowCurated
);

export const TOKEN_SAFE_LIST: Record<string, string> = keyBy(
  curatedRainbowTokenList.flatMap(({ name, symbol }) => [name, symbol]),
  id => id.toLowerCase()
);

export const CURATED_UNISWAP_TOKENS: Record<string, RainbowToken> = keyBy(
  curatedRainbowTokenList,
  'address'
);
