import { useQuery } from '@apollo/client';
import { getUnixTime, startOfMinute, sub } from 'date-fns';
import { pick, sortBy, toLower } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  UNISWAP_PAIR_DATA_QUERY,
  UNISWAP_PAIRS_BULK_QUERY,
  UNISWAP_PAIRS_HISTORICAL_BULK_QUERY,
  UNISWAP_PAIRS_ID_QUERY,
  UNISWAP_PAIRS_ID_QUERY_BY_TOKEN,
} from '../apollo/queries';
import { useEthUSDMonthChart, useEthUSDPrice } from '../utils/ethereumUtils';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/apollo/client' or ... Remove this comment to see the full error message
import { uniswapClient } from '@rainbow-me/apollo/client';
import {
  emitAssetRequest,
  emitChartsRequest,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/explorer' or... Remove this comment to see the full error message
} from '@rainbow-me/redux/explorer';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/uniswapLiqui... Remove this comment to see the full error message
import { setPoolsDetails } from '@rainbow-me/redux/uniswapLiquidity';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ETH_ADDRESS, WETH_ADDRESS } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { getBlocksFromTimestamps } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';
const UNISWAP_QUERY_INTERVAL = 1000 * 60 * 5; // 5 minutes
const AMOUNT_OF_PAIRS_TO_DISPLAY = 40;

export const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
};

const getTimestampsForChanges = () => {
  const t1 = getUnixTime(startOfMinute(sub(Date.now(), { days: 1 })));
  const t2 = getUnixTime(startOfMinute(sub(Date.now(), { months: 1 })));
  return [t1, t2];
};

async function getBulkPairData(
  pairList: any,
  ethPrice: any,
  ethPriceOneMonthAgo: any
) {
  try {
    const [t1, t2] = getTimestampsForChanges();
    const [{ number: b1 }, { number: b2 }] = await getBlocksFromTimestamps([
      t1,
      t2,
    ]);

    const current = await uniswapClient.query({
      fetchPolicy: 'no-cache',
      query: UNISWAP_PAIRS_BULK_QUERY,
      variables: {
        allPairs: pairList,
      },
    });

    const [oneDayResult, oneMonthResult] = await Promise.all(
      [b1, b2].map(async block => {
        const result = uniswapClient.query({
          fetchPolicy: 'no-cache',
          query: UNISWAP_PAIRS_HISTORICAL_BULK_QUERY,
          variables: {
            block: Number(block),
            pairs: pairList,
          },
        });
        return result;
      })
    );

    const oneDayData = oneDayResult?.data?.pairs.reduce(
      (obj: any, cur: any) => {
        return { ...obj, [cur.id]: cur };
      },
      {}
    );

    const oneMonthData = oneMonthResult?.data?.pairs.reduce(
      (obj: any, cur: any) => {
        return { ...obj, [cur.id]: cur };
      },
      {}
    );

    const pairData = await Promise.all(
      current &&
        current.data.pairs.map(async (pair: any) => {
          let data = pair;
          let oneDayHistory = oneDayData?.[pair?.id];
          if (!oneDayHistory) {
            const newData = await uniswapClient.query({
              fetchPolicy: 'no-cache',
              query: UNISWAP_PAIR_DATA_QUERY(pair?.id, b1),
            });
            oneDayHistory = newData?.data?.pairs[0];
          }
          let oneMonthHistory = oneMonthData?.[pair?.id];
          if (!oneMonthHistory) {
            const newData = await uniswapClient.query({
              fetchPolicy: 'no-cache',
              query: UNISWAP_PAIR_DATA_QUERY(pair?.id, b2),
            });
            oneMonthHistory = newData?.data?.pairs[0];
          }

          data = parseData(
            data,
            oneDayHistory,
            oneMonthHistory,
            ethPrice,
            ethPriceOneMonthAgo,
            b1
          );
          return data;
        })
    );
    return pairData;
  } catch (e) {
    logger.log('🦄🦄🦄 error in getBulkPairData', e);
  }
}

function parseData(
  data: any,
  oneDayData: any,
  oneMonthData: any,
  ethPrice: any,
  ethPriceOneMonthAgo: any,
  oneDayBlock: any
) {
  const newData = { ...data };
  // get volume changes
  const oneDayVolumeUSD = getOneDayVolume(
    newData?.volumeUSD,
    oneDayData?.volumeUSD ? oneDayData.volumeUSD : 0
  );

  newData.profit30d = calculateProfit30d(
    data,
    oneMonthData,
    ethPrice,
    ethPriceOneMonthAgo
  );

  // set volume properties
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
  newData.oneDayVolumeUSD = parseFloat(oneDayVolumeUSD);

  // set liquidity properties
  newData.trackedReserveUSD = newData.trackedReserveETH * ethPrice;
  newData.liquidityChangeUSD = getPercentChange(
    newData.reserveUSD,
    oneDayData?.reserveUSD
  );

  // format if pair hasnt existed for a day
  if (!oneDayData && data && newData.createdAtBlockNumber > oneDayBlock) {
    newData.oneDayVolumeUSD = parseFloat(newData.volumeUSD);
  }
  if (!oneDayData && data) {
    newData.oneDayVolumeUSD = parseFloat(newData.volumeUSD);
  }

  newData.annualized_fees =
    (newData.oneDayVolumeUSD * 0.003 * 365 * 100) / newData.trackedReserveUSD;

  return {
    address: newData?.id,
    annualized_fees: newData.annualized_fees,
    liquidity: Number(Number(newData.reserveUSD).toFixed(2)),
    oneDayVolumeUSD: newData.oneDayVolumeUSD,
    profit30d: newData.profit30d,
    symbol: 'UNI-V2',
    token0: pick(newData.token0, ['id', 'name', 'symbol']),
    token1: pick(newData.token1, ['id', 'name', 'symbol']),
    tokenNames: `${newData.token0.symbol}-${newData.token1.symbol}`.replace(
      'WETH',
      'ETH'
    ),
    type: 'uniswap-v2',
  };
}

export const getOneDayVolume = (valueNow: any, value24HoursAgo: any) =>
  parseFloat(valueNow) - parseFloat(value24HoursAgo);

export const calculateProfit30d = (
  data: any,
  valueOneMonthAgo: any,
  ethPriceNow: any,
  ethPriceOneMonthAgo: any
) => {
  const now = calculateLPTokenPrice(data, ethPriceNow);
  if (now === 0) {
    logger.log('🦄🦄🦄 lpTokenPrice now is 0', data, ethPriceNow);
  }

  if (valueOneMonthAgo === undefined) {
    return undefined;
  }

  if (ethPriceOneMonthAgo === undefined) {
    logger.log('🦄🦄🦄 ethPriceOneMonthAgo is missing.', ethPriceOneMonthAgo);
    return undefined;
  }
  const oneMonthAgo = calculateLPTokenPrice(
    valueOneMonthAgo,
    ethPriceOneMonthAgo
  );

  const percentageChange = getPercentChange(now, oneMonthAgo);
  return Number(percentageChange.toFixed(2));
};

export const calculateLPTokenPrice = (data: any, ethPrice: any) => {
  const {
    reserve0,
    reserve1,
    totalSupply,
    token0: { derivedETH: token0DerivedEth },
    token1: { derivedETH: token1DerivedEth },
  } = data;

  const tokenPerShare = 100 / totalSupply;

  const reserve0USD =
    Number(reserve0) * (Number(token0DerivedEth) * Number(ethPrice));
  const reserve1USD =
    Number(reserve1) * (Number(token1DerivedEth) * Number(ethPrice));

  const token0LiquidityPrice = (reserve0USD * tokenPerShare) / 100;
  const token1LiquidityPrice = (reserve1USD * tokenPerShare) / 100;
  const lpTokenPrice = token0LiquidityPrice + token1LiquidityPrice;

  return lpTokenPrice;
};

/**
 * get standard percent change between two values
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
export const getPercentChange = (valueNow: any, value24HoursAgo: any) => {
  const adjustedPercentChange =
    ((parseFloat(valueNow) - parseFloat(value24HoursAgo)) /
      parseFloat(value24HoursAgo)) *
    100;
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return 0;
  }
  return adjustedPercentChange;
};

export default function useUniswapPools(
  sortField: any,
  sortDirection: any,
  token: any
) {
  const dispatch = useDispatch();

  const [pairs, setPairs] = useState();
  const priceOfEther = useEthUSDPrice();
  const ethereumPriceOneMonthAgo = useEthUSDMonthChart()?.[0]?.[1];

  useEffect(() => {
    pairs &&
      dispatch(
        setPoolsDetails(
          // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
          pairs.reduce((acc: any, pair: any) => {
            acc[pair.address] = pair;
            return acc;
          }, {})
        )
      );
  }, [pairs, dispatch]);

  const genericAssets = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
    ({ data: { genericAssets } }) => genericAssets
  );

  const { data: idsData, error } = useQuery(
    token ? UNISWAP_PAIRS_ID_QUERY_BY_TOKEN : UNISWAP_PAIRS_ID_QUERY,
    {
      client: uniswapClient,
      fetchPolicy: 'no-cache',
      pollInterval: UNISWAP_QUERY_INTERVAL,
      skip: !priceOfEther,
      variables: {
        address: token === ETH_ADDRESS ? WETH_ADDRESS : token,
      },
    }
  );

  const isEmpty =
    idsData?.pairs?.length === 0 ||
    (idsData?.pairs0?.length === 0 && idsData?.pairs1?.length === 0);

  const pairsFromQuery = useMemo(
    () =>
      token
        ? (idsData?.pairs0?.concat(idsData?.pairs1) ?? [])
            .sort(
              (a: any, b: any) =>
                Number(b.trackedReserveETH) - Number(a.trackedReserveETH)
            )
            .slice(0, 30)
        : idsData?.pairs ?? [],
    [idsData?.pairs, idsData?.pairs0, idsData?.pairs1, token]
  );

  const fetchPairsData = useCallback(async () => {
    // get data for every pair in list
    try {
      const topPairs = await getBulkPairData(
        pairsFromQuery.map((item: any) => item?.id),
        Number(priceOfEther),
        Number(ethereumPriceOneMonthAgo)
      );
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '[unknown, unknown, unknown, unkn... Remove this comment to see the full error message
      setPairs(topPairs);
    } catch (e) {
      logger.log('🦄🦄🦄 error getting pairs data', e);
    }
  }, [ethereumPriceOneMonthAgo, pairsFromQuery, priceOfEther]);

  useEffect(() => {
    if (pairsFromQuery && priceOfEther > 0) {
      fetchPairsData();
    }
  }, [fetchPairsData, priceOfEther, ethereumPriceOneMonthAgo, pairsFromQuery]);

  const currenciesRate = useNativeCurrencyToUSD();

  const top40PairsSorted = useMemo(() => {
    if (!pairs) return null;
    let sortedPairs = sortBy(pairs, sortField);
    if (sortDirection === SORT_DIRECTION.DESC) {
      sortedPairs = sortedPairs.reverse();
    }

    // top 40
    sortedPairs = sortedPairs.slice(0, AMOUNT_OF_PAIRS_TO_DISPLAY - 1);
    const tmpAllTokens = [];
    // Override with tokens from generic assets
    sortedPairs = sortedPairs.map(pair => {
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      const token0 = (toLower(pair.token0?.id) === WETH_ADDRESS
        ? genericAssets['eth']
        : // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
          genericAssets[toLower(pair.token0?.id)]) || {
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        ...pair.token0,
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        address: pair.token0?.id,
      };
      const token1 =
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        toLower(pair.token1?.id) === WETH_ADDRESS
          ? genericAssets['eth']
          : // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
            genericAssets[toLower(pair.token1?.id)] || {
              // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
              ...pair.token1,
              // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
              address: pair.token1?.id,
            };
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      pair.tokens = [token0, token1];
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      tmpAllTokens.push(toLower(pair.tokens[0]?.id));
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      tmpAllTokens.push(toLower(pair.tokens[1]?.id));
      const pairAdjustedForCurrency = {
        // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
        ...pair,
        liquidity: pair.liquidity * currenciesRate,
        oneDayVolumeUSD: pair.oneDayVolumeUSD * currenciesRate,
      };
      return pick(pairAdjustedForCurrency, [
        'address',
        'annualized_fees',
        'liquidity',
        'oneDayVolumeUSD',
        'profit30d',
        'symbol',
        'tokens',
        'tokenNames',
        'type',
      ]);
    });

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '({ address }: { address: any; })... Remove this comment to see the full error message
    const allLPTokens = sortedPairs.map(({ address }) => address);
    dispatch(emitAssetRequest(allLPTokens));
    dispatch(emitChartsRequest(allLPTokens));
    return sortedPairs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, pairs, sortDirection, sortField]);

  return {
    error,
    is30DayEnabled: ethereumPriceOneMonthAgo > 0,
    isEmpty,
    pairs: top40PairsSorted,
  };
}
