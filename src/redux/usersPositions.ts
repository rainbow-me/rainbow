import { AnyAction } from 'redux';
import { uniswapClient } from '../apollo/client';
import {
  USER_HISTORY,
  USER_MINTS_BURNS_PER_PAIR,
  USER_POSITIONS,
} from '../apollo/queries';
import { AppDispatch, AppGetState } from '@rainbow-me/redux/store';
import {
  BUSD_ADDRESS,
  DAI_ADDRESS,
  GUSD_ADDRESS,
  SUSD_ADDRESS,
  TUSD_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
  WETH_ADDRESS,
} from '@rainbow-me/references';
import { ethereumUtils, logger } from '@rainbow-me/utils';

const PRICE_DISCOVERY_START_TIMESTAMP = 1589747086;

export const priceOverrides = [
  USDC_ADDRESS,
  DAI_ADDRESS,
  USDT_ADDRESS,
  TUSD_ADDRESS,
  BUSD_ADDRESS,
  SUSD_ADDRESS,
  GUSD_ADDRESS,
];
export interface TypeSpecificParameters {
  cTokenBalance: string;
  supplyBalanceUnderlying: string;
}

interface PositionsState {
  [key: string]: any;
}

interface ReturnMetrics {
  hodleReturn: number; // difference in asset values t0 -> t1 with t0 deposit amounts
  netReturn: number; // net return from t0 -> t1
  uniswapReturn: number; // netReturn - hodlReturn
  impLoss: number;
  fees: number;
}

// used to calculate returns within a given window bounded by two positions
interface Position {
  pair: any;
  liquidityTokenBalance: number;
  liquidityTokenTotalSupply: number;
  reserve0: number;
  reserve1: number;
  reserveUSD: number;
  token0PriceUSD: number;
  token1PriceUSD: number;
}

export type StoredPositions = Position &
  ReturnMetrics & { fees: { sum: number } };

// --- fetching ----------------//

// -- Constants --------------------------------------- //
const UPDATE_POSITIONS = 'positions/UPDATE_POSITIONS';

function formatPricesForEarlyTimestamps(position: any): Position {
  if (position.timestamp < PRICE_DISCOVERY_START_TIMESTAMP) {
    if (priceOverrides.includes(position?.pair?.token0.id)) {
      position.token0PriceUSD = 1;
    }
    if (priceOverrides.includes(position?.pair?.token1.id)) {
      position.token1PriceUSD = 1;
    }
    // WETH price
    if (position.pair?.token0.id === WETH_ADDRESS) {
      position.token0PriceUSD = 203;
    }
    if (position.pair?.token1.id === WETH_ADDRESS) {
      position.token1PriceUSD = 203;
    }
  }
  return position;
}

function getMetricsForPositionWindow(
  positionT0: Position,
  positionT1: Position
): ReturnMetrics {
  positionT0 = formatPricesForEarlyTimestamps(positionT0);
  positionT1 = formatPricesForEarlyTimestamps(positionT1);

  // calculate ownership at ends of window, for end of window we need original LP token balance / new total supply
  const t0Ownership =
    positionT0.liquidityTokenBalance / positionT0.liquidityTokenTotalSupply;
  const t1Ownership =
    positionT0.liquidityTokenBalance / positionT1.liquidityTokenTotalSupply;

  // get starting amounts of token0 and token1 deposited by LP
  const token0_amount_t0 = t0Ownership * positionT0.reserve0;
  const token1_amount_t0 = t0Ownership * positionT0.reserve1;

  // get current token values
  const token0_amount_t1 = t1Ownership * positionT1.reserve0;
  const token1_amount_t1 = t1Ownership * positionT1.reserve1;

  // calculate squares to find imp loss and fee differences
  const sqrK_t0 = Math.sqrt(token0_amount_t0 * token1_amount_t0);
  const priceRatioT1 =
    // eslint-disable-next-line eqeqeq
    positionT1.token0PriceUSD != 0
      ? positionT1.token1PriceUSD / positionT1.token0PriceUSD
      : 0;

  const token0_amount_no_fees =
    positionT1.token1PriceUSD && priceRatioT1
      ? sqrK_t0 * Math.sqrt(priceRatioT1)
      : 0;
  const token1_amount_no_fees =
    Number(positionT1.token1PriceUSD) && priceRatioT1
      ? sqrK_t0 / Math.sqrt(priceRatioT1)
      : 0;
  const no_fees_usd =
    token0_amount_no_fees * positionT1.token0PriceUSD +
    token1_amount_no_fees * positionT1.token1PriceUSD;

  const difference_fees_token0 = token0_amount_t1 - token0_amount_no_fees;
  const difference_fees_token1 = token1_amount_t1 - token1_amount_no_fees;
  const difference_fees_usd =
    difference_fees_token0 * positionT1.token0PriceUSD +
    difference_fees_token1 * positionT1.token1PriceUSD;

  // calculate USD value at t0 and t1 using initial token deposit amounts for asset return
  const assetValueT0 =
    token0_amount_t0 * positionT0.token0PriceUSD +
    token1_amount_t0 * positionT0.token1PriceUSD;
  const assetValueT1 =
    token0_amount_t0 * positionT1.token0PriceUSD +
    token1_amount_t0 * positionT1.token1PriceUSD;

  const imp_loss_usd = no_fees_usd - assetValueT1;
  const uniswap_return = difference_fees_usd + imp_loss_usd;

  // get net value change for combined data
  const netValueT0 = t0Ownership * positionT0.reserveUSD;
  const netValueT1 = t1Ownership * positionT1.reserveUSD;

  return {
    fees: difference_fees_usd,
    hodleReturn: assetValueT1 - assetValueT0,
    impLoss: imp_loss_usd,
    netReturn: netValueT1 - netValueT0,
    uniswapReturn: uniswap_return,
  };
}

async function getPrincipalForUserPerPair(user: string, pairAddress: string) {
  let usd = 0;
  let amount0 = 0;
  let amount1 = 0;
  // get all mints and burns to get principal amounts
  const results = await uniswapClient.query({
    query: USER_MINTS_BURNS_PER_PAIR,
    variables: {
      pair: pairAddress,
      user,
    },
  });
  for (const index in results.data.mints) {
    const mint = results.data.mints[index];
    const mintToken0 = mint.pair.token0.id;
    const mintToken1 = mint.pair.token1.id;

    // if tracking before prices were discovered (pre-launch days), hardcode stablecoins
    if (
      priceOverrides.includes(mintToken0) &&
      mint.timestamp < PRICE_DISCOVERY_START_TIMESTAMP
    ) {
      usd += parseFloat(mint.amount0) * 2;
    } else if (
      priceOverrides.includes(mintToken1) &&
      mint.timestamp < PRICE_DISCOVERY_START_TIMESTAMP
    ) {
      usd += parseFloat(mint.amount1) * 2;
    } else {
      usd += parseFloat(mint.amountUSD);
    }
    amount0 += amount0 + parseFloat(mint.amount0);
    amount1 += amount1 + parseFloat(mint.amount1);
  }

  for (const index in results.data.burns) {
    const burn = results.data.burns[index];
    const burnToken0 = burn.pair.token0.id;
    const burnToken1 = burn.pair.token1.id;

    // if tracking before prices were discovered (pre-launch days), hardcode stablecoins
    if (
      priceOverrides.includes(burnToken0) &&
      burn.timestamp < PRICE_DISCOVERY_START_TIMESTAMP
    ) {
      usd += parseFloat(burn.amount0) * 2;
    } else if (
      priceOverrides.includes(burnToken1) &&
      burn.timestamp < PRICE_DISCOVERY_START_TIMESTAMP
    ) {
      usd += parseFloat(burn.amount1) * 2;
    } else {
      usd -= parseFloat(results.data.burns[index].amountUSD);
    }

    amount0 -= parseFloat(results.data.burns[index].amount0);
    amount1 -= parseFloat(results.data.burns[index].amount1);
  }

  return { amount0, amount1, usd };
}

async function getLPReturnsOnPair(
  user: string,
  pair: any,
  ethPrice: number,
  snapshots: any
) {
  // initialize values
  const principal = await getPrincipalForUserPerPair(user, pair.id);
  let hodlReturn = 0;
  let netReturn = 0;
  let uniswapReturn = 0;
  let fees = 0;

  snapshots = snapshots.filter((entry: any) => {
    return entry.pair.id === pair.id;
  });

  // get data about the current position
  const currentPosition: Position = {
    liquidityTokenBalance:
      snapshots[snapshots.length - 1]?.liquidityTokenBalance,
    liquidityTokenTotalSupply: pair.totalSupply,
    pair,
    reserve0: pair.reserve0,
    reserve1: pair.reserve1,
    reserveUSD: pair.reserveUSD,
    token0PriceUSD: pair.token0.derivedETH * ethPrice,
    token1PriceUSD: pair.token1.derivedETH * ethPrice,
  };

  for (const index in snapshots) {
    // get positions at both bounds of the window
    const positionT0 = snapshots[index];
    const positionT1 =
      parseInt(index) === snapshots.length - 1
        ? currentPosition
        : snapshots[parseInt(index) + 1];

    const results = getMetricsForPositionWindow(positionT0, positionT1);
    hodlReturn = hodlReturn + results.hodleReturn;
    netReturn = netReturn + results.netReturn;
    uniswapReturn = uniswapReturn + results.uniswapReturn;
    fees = fees + results.fees;
  }

  return {
    fees: {
      sum: fees,
    },
    net: {
      return: netReturn,
    },
    principal,
    uniswap: {
      return: uniswapReturn,
    },
  };
}

async function fetchSnapshots(account: string): Promise<Position[]> {
  try {
    let skip = 0;
    let allResults: any[] = [];
    let found = false;
    while (!found) {
      let result = await uniswapClient.query({
        fetchPolicy: 'no-cache',
        query: USER_HISTORY,
        variables: {
          skip: skip,
          user: account.toLowerCase(),
        },
      });
      allResults = allResults.concat(result.data.liquidityPositionSnapshots);
      if (result.data.liquidityPositionSnapshots.length < 1000) {
        found = true;
      } else {
        skip += 1000;
      }
    }
    return allResults;
  } catch (e) {
    logger.sentry('Error fetching positions', e);
  }
  return [];
}

async function fetchData(account: string): Promise<StoredPositions[]> {
  const priceOfEther = ethereumUtils.getEthPriceUnit();

  try {
    let result = await uniswapClient.query({
      fetchPolicy: 'no-cache',
      query: USER_POSITIONS,
      variables: {
        user: account.toLowerCase(),
      },
    });
    if (result?.data?.liquidityPositions) {
      const snapshots = await fetchSnapshots(account);

      return await Promise.all(
        result?.data?.liquidityPositions.map(async (positionData: Position) => {
          const returnData = await getLPReturnsOnPair(
            account,
            positionData.pair,
            Number(priceOfEther),
            snapshots
          );
          return {
            ...positionData,
            ...returnData,
          };
        })
      );
    }
  } catch (e) {
    logger.sentry('Error fetching positions', e);
  }
  return [];
}

// -- Actions ---------------------------------------- //

export const updatePositions = async (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  const { accountAddress } = getState().settings;
  const data = await fetchData(accountAddress);

  dispatch({
    payload: { [accountAddress]: data },
    type: UPDATE_POSITIONS,
  });
};

const INITIAL_STATE: PositionsState = {};

export default (state = INITIAL_STATE, action: AnyAction) => {
  switch (action.type) {
    case UPDATE_POSITIONS:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};
