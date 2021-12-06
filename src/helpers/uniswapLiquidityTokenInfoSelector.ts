import { ChainId, WETH } from '@uniswap/sdk';
import {
  compact,
  find,
  isEmpty,
  join,
  map,
  orderBy,
  sumBy,
  toLower,
} from 'lodash';
import { createSelector } from 'reselect';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { Asset, ParsedAddressAsset } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/parsers' or its co... Remove this comment to see the full error message
import { parseAssetsNative } from '@rainbow-me/parsers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import { AppState } from '@rainbow-me/redux/store';
import {
  PositionsState,
  UniswapPosition,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/usersPositio... Remove this comment to see the full error message
} from '@rainbow-me/redux/usersPositions';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ETH_ADDRESS } from '@rainbow-me/references';
import {
  convertAmountToNativeDisplay,
  divide,
  handleSignificantDecimals,
  handleSignificantDecimalsWithThreshold,
  multiply,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
} from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'address' does not exist on type 'Token'.
  if (toLower(token.address) === toLower(WETH[chainId].address)) {
    return {
      ...token,
      // @ts-expect-error ts-migrate(2322) FIXME: Type '{ address: any; decimals: number; name: stri... Remove this comment to see the full error message
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
  const liquidityTokenWithNative = parseAssetsNative(
    [liquidityToken],
    nativeCurrency
  )?.[0];

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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'address' does not exist on type 'Token'.
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
      const liquidityToken = find(
        uniswapLiquidityTokens,
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
