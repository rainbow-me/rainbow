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
import { uniswapClient } from '@rainbow-me/apollo/client';
import {
  emitAssetRequest,
  emitChartsRequest,
} from '@rainbow-me/redux/explorer';
import { setPoolsDetails } from '@rainbow-me/redux/uniswapLiquidity';
import { ETH_ADDRESS, WETH_ADDRESS } from '@rainbow-me/references';
import { getBlocksFromTimestamps } from '@rainbow-me/utils';
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

async function getBulkPairData(pairList, ethPrice, ethPriceOneMonthAgo) {
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

    const oneDayData = oneDayResult?.data?.pairs.reduce((obj, cur) => {
      return { ...obj, [cur.id]: cur };
    }, {});

    const oneMonthData = oneMonthResult?.data?.pairs.reduce((obj, cur) => {
      return { ...obj, [cur.id]: cur };
    }, {});

    const pairData = await Promise.all(
      current &&
        current.data.pairs.map(async pair => {
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
  data,
  oneDayData,
  oneMonthData,
  ethPrice,
  ethPriceOneMonthAgo,
  oneDayBlock
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

export const getOneDayVolume = (valueNow, value24HoursAgo) =>
  parseFloat(valueNow) - parseFloat(value24HoursAgo);

export const calculateProfit30d = (
  data,
  valueOneMonthAgo,
  ethPriceNow,
  ethPriceOneMonthAgo
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

export const calculateLPTokenPrice = (data, ethPrice) => {
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
export const getPercentChange = (valueNow, value24HoursAgo) => {
  const adjustedPercentChange =
    ((parseFloat(valueNow) - parseFloat(value24HoursAgo)) /
      parseFloat(value24HoursAgo)) *
    100;
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return 0;
  }
  return adjustedPercentChange;
};

export default function useUniswapPools(sortField, sortDirection, token) {
  const dispatch = useDispatch();

  const [pairs, setPairs] = useState();
  const priceOfEther = useEthUSDPrice();
  const ethereumPriceOneMonthAgo = useEthUSDMonthChart()?.[0]?.[1];

  useEffect(() => {
    pairs &&
      dispatch(
        setPoolsDetails(
          pairs.reduce((acc, pair) => {
            acc[pair.address] = pair;
            return acc;
          }, {})
        )
      );
  }, [pairs, dispatch]);

  const genericAssets = useSelector(
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
              (a, b) =>
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
        pairsFromQuery.map(item => item?.id),
        Number(priceOfEther),
        Number(ethereumPriceOneMonthAgo)
      );
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
      const token0 = (toLower(pair.token0?.id) === WETH_ADDRESS
        ? genericAssets['eth']
        : genericAssets[toLower(pair.token0?.id)]) || {
        ...pair.token0,
        address: pair.token0?.id,
      };
      const token1 =
        toLower(pair.token1?.id) === WETH_ADDRESS
          ? genericAssets['eth']
          : genericAssets[toLower(pair.token1?.id)] || {
              ...pair.token1,
              address: pair.token1?.id,
            };
      pair.tokens = [token0, token1];
      tmpAllTokens.push(toLower(pair.tokens[0]?.id));
      tmpAllTokens.push(toLower(pair.tokens[1]?.id));
      const pairAdjustedForCurrency = {
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
