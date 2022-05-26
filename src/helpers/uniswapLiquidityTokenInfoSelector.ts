import { ChainId, WETH } from '@uniswap/sdk';
import { compact, isEmpty, join, map, orderBy, sumBy, toLower } from 'lodash';
import { createSelector } from 'reselect';
import { Asset, ParsedAddressAsset } from '@rainbow-me/entities';
import { parseAssetNative } from '@rainbow-me/parsers';
import { AppState } from '@rainbow-me/redux/store';
import {
  PositionsState,
  UniswapPosition,
} from '@rainbow-me/redux/usersPositions';
import { ETH_ADDRESS } from '@rainbow-me/references';
import {
  convertAmountToNativeDisplay,
  divide,
  handleSignificantDecimals,
  handleSignificantDecimalsWithThreshold,
  multiply,
} from '@rainbow-me/utilities';
import { getTokenMetadata } from '@rainbow-me/utils';

const accountAddressSelector = (state: AppState) =>
  state.settings.accountAddress;
const chainIdSelector = (state: AppState) => state.settings.chainId;
const nativeCurrencySelector = (state: AppState) =>
  state.settings.nativeCurrency;
const uniswapLiquidityPositionsSelector = (state: AppState) =>
  state.usersPositions;
const uniswapLiquidityTokensSelector = (state: AppState) =>
  state.uniswapLiquidity.liquidityTokens;

interface Price {
  changed_at?: number | null;
  relative_change_24h?: number | null;
  value?: number | null;
}

interface Token extends Asset {
  balance: string;
  value: string;
}

interface UniswapPool {
  address?: string;
  price?: Price | null;
  tokenNames: string;
  tokens: Token[];
  totalBalancePrice: string;
  totalNativeDisplay: string;
  type?: string;
  uniBalance: string;
}

interface UniswapCard {
  uniswap: UniswapPool[];
  uniswapTotal: number;
}

const switchWethToEth = (token: Token, chainId: ChainId): Token => {
  if (toLower(token.address) === toLower(WETH[chainId].address)) {
    return {
      ...token,
      address: ETH_ADDRESS,
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    };
  }
  return token;
};

const transformPool = (
  liquidityToken: ParsedAddressAsset | undefined,
  position: UniswapPosition,
  nativeCurrency: string,
  chainId: ChainId
): UniswapPool | null => {
  if (isEmpty(position)) {
    return null;
  }
  const liquidityTokenWithNative = parseAssetNative(
    liquidityToken,
    nativeCurrency
  );

  const price = liquidityTokenWithNative?.price;
  const {
    liquidityTokenBalance: balanceAmount,
    pair: { totalSupply, reserve0, reserve1 },
  } = position;

  const token0Balance = divide(multiply(reserve0, balanceAmount), totalSupply);
  const token1Balance = divide(multiply(reserve1, balanceAmount), totalSupply);

  const token0: Token = switchWethToEth(
    {
      ...position?.pair?.token0,
      address: position?.pair?.token0?.id,
      balance: token0Balance,
    },
    chainId
  );

  const token1: Token = switchWethToEth(
    {
      ...position?.pair?.token1,
      address: position?.pair?.token1?.id,
      balance: token1Balance,
    },
    chainId
  );

  const tokens = [token0, token1];

  const totalBalancePrice = multiply(balanceAmount, price?.value || 0);
  const totalNativeDisplay = convertAmountToNativeDisplay(
    totalBalancePrice,
    nativeCurrency
  );

  const formattedTokens = map(tokens, token => ({
    ...token,
    ...getTokenMetadata(token.address),
    value: handleSignificantDecimalsWithThreshold(token.balance, 4),
  }));

  const tokenNames = join(
    map(formattedTokens, token => token.symbol),
    '-'
  );

  return {
    ...liquidityTokenWithNative,
    tokenNames,
    tokens: formattedTokens,
    totalBalancePrice,
    totalNativeDisplay,
    uniBalance: handleSignificantDecimals(balanceAmount, 3),
  };
};

const buildUniswapCards = (
  accountAddress: string,
  chainId: number,
  nativeCurrency: string,
  uniswapLiquidityTokens: ParsedAddressAsset[],
  allUniswapLiquidityPositions: PositionsState
): UniswapCard => {
  const uniswapLiquidityPositions =
    allUniswapLiquidityPositions?.[accountAddress];
  const uniswapPools = compact(
    map(uniswapLiquidityPositions, position => {
      const liquidityToken = uniswapLiquidityTokens.find(
        token => token.address === position?.pair?.id
      );
      return transformPool(liquidityToken, position, nativeCurrency, chainId);
    })
  );
  const orderedUniswapPools = orderBy(
    uniswapPools,
    [({ totalBalancePrice }) => Number(totalBalancePrice)],
    ['desc']
  );

  let uniswapTotal = 0;

  if (Array.isArray(orderedUniswapPools) && orderedUniswapPools.length) {
    uniswapTotal = sumBy(orderedUniswapPools, ({ totalBalancePrice }) =>
      Number(totalBalancePrice)
    );
  }

  return {
    uniswap: orderedUniswapPools,
    uniswapTotal,
  };
};

export const readableUniswapSelector = createSelector(
  [
    accountAddressSelector,
    chainIdSelector,
    nativeCurrencySelector,
    uniswapLiquidityTokensSelector,
    uniswapLiquidityPositionsSelector,
  ],
  buildUniswapCards
);
