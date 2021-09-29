import { filter, flatMap, keyBy, map, toLower } from 'lodash';
import RAINBOW_TOKEN_LIST_DATA from './rainbow-token-list.json';

import { default as UNISWAP_TESTNET_TOKEN_LIST } from './uniswap-pairs-testnet.json';
import { abi as UNISWAP_V2_ROUTER_ABI } from './uniswap-v2-router.json';
import UNISWAP_V1_EXCHANGE_ABI from './v1-exchange-abi';
import { RainbowToken } from '@rainbow-me/entities';

const tokenList: RainbowToken[] = map(RAINBOW_TOKEN_LIST_DATA.tokens, token => {
  const { address: rawAddress, decimals, name, symbol, extensions } = token;
  const address = toLower(rawAddress);
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

const RAINBOW_TOKEN_LIST: Record<string, RainbowToken> = keyBy(
  tokenListWithEth,
  'address'
);

const curatedRainbowTokenList: RainbowToken[] = filter(
  tokenListWithEth,
  'isRainbowCurated'
);

const TOKEN_SAFE_LIST: Record<string, string> = keyBy(
  flatMap(curatedRainbowTokenList, ({ name, symbol }) => [name, symbol]),
  id => toLower(id)
);

const CURATED_UNISWAP_TOKENS: Record<string, RainbowToken> = keyBy(
  curatedRainbowTokenList,
  'address'
);


export {
  CURATED_UNISWAP_TOKENS,
  RAINBOW_TOKEN_LIST,
  TOKEN_SAFE_LIST,
  UNISWAP_TESTNET_TOKEN_LIST,
  UNISWAP_V1_EXCHANGE_ABI,
  UNISWAP_V2_ROUTER_ABI,
};
