import { compact, find, isEmpty, join, map, orderBy, sumBy } from 'lodash';
import { createSelector } from 'reselect';
import { ParsedAddressAsset } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';
import {
  PositionsState,
  StoredPosition,
} from '@rainbow-me/redux/usersPositions';
import {
  convertAmountToNativeDisplay,
  divide,
  handleSignificantDecimals,
  handleSignificantDecimalsWithThreshold,
  multiply,
} from '@rainbow-me/utilities';
import { getTokenMetadata } from '@rainbow-me/utils';

const nativeCurrencySelector = (state: AppState) =>
  state.settings.nativeCurrency;
const accountAddressSelector = (state: AppState) =>
  state.settings.accountAddress;
const uniswapLiquidityPositionsSelector = (state: AppState) =>
  state.usersPositions;
const uniswapLiquidityTokensSelector = (state: AppState) =>
  state.uniswapLiquidity.liquidityTokens;

interface Price {
  changed_at?: number | null;
  relative_change_24h?: number | null;
  value?: number | null;
}

interface Token {
  address: string;
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

const transformPool = (
  liquidityToken: ParsedAddressAsset | undefined,
  position: StoredPosition,
  nativeCurrency: string
): UniswapPool | null => {
  if (isEmpty(position)) {
    return null;
  }

  const price = liquidityToken?.price;
  const {
    liquidityTokenBalance: balanceAmount,
    pair: { totalSupply, reserve0, reserve1 },
  } = position;

  const token0Balance = divide(multiply(reserve0, balanceAmount), totalSupply);
  const token1Balance = divide(multiply(reserve1, balanceAmount), totalSupply);
  const token0 = {
    ...position?.pair?.token0,
    address: position?.pair?.token0?.id,
    balance: token0Balance,
  };
  const token1 = {
    ...position?.pair?.token1,
    address: position?.pair?.token1?.id,
    balance: token1Balance,
  };
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
    ...liquidityToken,
    tokenNames,
    tokens: formattedTokens,
    totalBalancePrice,
    totalNativeDisplay,
    uniBalance: handleSignificantDecimals(balanceAmount, 3),
  };
};

const buildUniswapCards = (
  accountAddress: string,
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
      return transformPool(liquidityToken, position, nativeCurrency);
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
    nativeCurrencySelector,
    uniswapLiquidityTokensSelector,
    uniswapLiquidityPositionsSelector,
  ],
  buildUniswapCards
);
