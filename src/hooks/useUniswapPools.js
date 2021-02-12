import { useQuery } from '@apollo/client';
import { getUnixTime, startOfMinute, sub } from 'date-fns';
import { get, sortBy, toLower, uniq } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { blockClient, uniswapClient } from '@rainbow-me/apollo/client';
import {
  GET_BLOCKS_QUERY,
  UNISWAP_PAIR_DATA_QUERY,
  UNISWAP_PAIRS_BULK_QUERY,
  UNISWAP_PAIRS_HISTORICAL_BULK_QUERY,
  UNISWAP_PAIRS_ID_QUERY,
} from '@rainbow-me/apollo/queries';
// import {
//   getUniswapPools,
//   saveUniswapPools,
// } from '@rainbow-me/handlers/localstorage/uniswapPools';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
import { emitAssetRequest } from '@rainbow-me/redux/explorer';
import { ETH_ADDRESS, WETH_ADDRESS } from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

const UNISWAP_QUERY_INTERVAL = 1000 * 60 * 5; // 5 minutes

export const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
};

async function splitQuery(query, localClient, vars, list, skipCount = 100) {
  let fetchedData = {};
  let allFound = false;
  let skip = 0;

  while (!allFound) {
    let end = list.length;
    if (skip + skipCount < list.length) {
      end = skip + skipCount;
    }
    let sliced = list.slice(skip, end);
    try {
      let result = await localClient.query({
        fetchPolicy: 'cache-first',
        query: query(...vars, sliced),
      });
      fetchedData = {
        ...fetchedData,
        ...result.data,
      };

      if (
        Object.keys(result.data).length < skipCount ||
        skip + skipCount > list.length
      ) {
        allFound = true;
      } else {
        skip += skipCount;
      }
    } catch (e) {
      logger.log('🦄🦄🦄 FUCK SPLIT QUERY', e);
    }
  }

  return fetchedData;
}

export async function getBlocksFromTimestamps(timestamps, skipCount = 500) {
  if (timestamps?.length === 0) {
    return [];
  }

  let fetchedData = await splitQuery(
    GET_BLOCKS_QUERY,
    blockClient,
    [],
    timestamps,
    skipCount
  );

  let blocks = [];
  if (fetchedData) {
    for (var t in fetchedData) {
      if (fetchedData[t].length > 0) {
        blocks.push({
          number: fetchedData[t][0]['number'],
          timestamp: t.split('t')[1],
        });
      }
    }
  }

  return blocks;
}

const getTimestampsForChanges = () => {
  const t1 = getUnixTime(startOfMinute(sub(Date.now(), { days: 1 })));
  const t2 = getUnixTime(startOfMinute(sub(Date.now(), { days: 2 })));
  const t3 = getUnixTime(startOfMinute(sub(Date.now(), { months: 1 })));
  return [t1, t2, t3];
};

async function getBulkPairData(
  pairList,
  ethPrice,
  ethPriceOneMonthAgo,
  genericAssets
) {
  const [t1, t2, t3] = getTimestampsForChanges();
  let [
    { number: b1 },
    { number: b2 },
    { number: b3 },
  ] = await getBlocksFromTimestamps([t1, t2, t3]);

  try {
    let current = await uniswapClient.query({
      fetchPolicy: 'cache-first',
      query: UNISWAP_PAIRS_BULK_QUERY,
      variables: {
        allPairs: pairList,
      },
    });

    let [oneDayResult, twoDayResult, oneMonthResult] = await Promise.all(
      [b1, b2, b3].map(async block => {
        let result = uniswapClient.query({
          fetchPolicy: 'cache-first',
          query: UNISWAP_PAIRS_HISTORICAL_BULK_QUERY(block, pairList),
        });
        return result;
      })
    );

    let oneDayData = oneDayResult?.data?.pairs.reduce((obj, cur) => {
      return { ...obj, [cur.id]: cur };
    }, {});

    let twoDayData = twoDayResult?.data?.pairs.reduce((obj, cur) => {
      return { ...obj, [cur.id]: cur };
    }, {});

    let oneMonthData = oneMonthResult?.data?.pairs.reduce((obj, cur) => {
      return { ...obj, [cur.id]: cur };
    }, {});

    let pairData = await Promise.all(
      current &&
        current.data.pairs.map(async pair => {
          let data = pair;
          let oneDayHistory = oneDayData?.[pair.id];
          if (!oneDayHistory) {
            let newData = await uniswapClient.query({
              fetchPolicy: 'cache-first',
              query: UNISWAP_PAIR_DATA_QUERY(pair.id, b1),
            });
            oneDayHistory = newData.data.pairs[0];
          }
          let twoDayHistory = twoDayData?.[pair.id];
          if (!twoDayHistory) {
            let newData = await uniswapClient.query({
              fetchPolicy: 'cache-first',
              query: UNISWAP_PAIR_DATA_QUERY(pair.id, b2),
            });
            twoDayHistory = newData.data.pairs[0];
          }
          let oneMonthHistory = oneMonthData?.[pair.id];
          if (!oneMonthHistory) {
            let newData = await uniswapClient.query({
              fetchPolicy: 'cache-first',
              query: UNISWAP_PAIR_DATA_QUERY(pair.id, b2),
            });
            oneMonthHistory = newData.data.pairs[0];
          }
          data = parseData(
            data,
            oneDayHistory,
            twoDayHistory,
            oneMonthHistory,
            ethPrice,
            ethPriceOneMonthAgo,
            b1,
            genericAssets
          );
          return data;
        })
    );
    return pairData;
  } catch (e) {
    logger.log(e);
  }
}

function parseData(
  data,
  oneDayData,
  twoDayData,
  oneMonthData,
  ethPrice,
  ethPriceOneMonthAgo,
  oneDayBlock,
  genericAssets
) {
  const newData = { ...data };
  // get volume changes
  const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
    newData?.volumeUSD,
    oneDayData?.volumeUSD ? oneDayData.volumeUSD : 0,
    twoDayData?.volumeUSD ? twoDayData.volumeUSD : 0
  );
  const [oneDayVolumeUntracked, volumeChangeUntracked] = get2DayPercentChange(
    newData?.untrackedVolumeUSD,
    oneDayData?.untrackedVolumeUSD
      ? parseFloat(oneDayData?.untrackedVolumeUSD)
      : 0,
    twoDayData?.untrackedVolumeUSD ? twoDayData?.untrackedVolumeUSD : 0
  );

  newData.profit30d = calculateProfit30d(
    data,
    oneMonthData,
    ethPrice,
    ethPriceOneMonthAgo
  );

  // set volume properties
  newData.oneDayVolumeUSD = parseFloat(oneDayVolumeUSD);
  newData.volumeChangeUSD = volumeChangeUSD;
  newData.oneDayVolumeUntracked = oneDayVolumeUntracked;
  newData.volumeChangeUntracked = volumeChangeUntracked;

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

  newData.anualized_fees =
    (newData.oneDayVolumeUSD * 0.003 * 365 * 100) / newData.trackedReserveUSD;

  let token0 =
    (toLower(newData.token0.id) === WETH_ADDRESS
      ? genericAssets['eth']
      : genericAssets[toLower(newData.token0.id)]) || newData.token0;
  let token1 =
    toLower(newData.token1.id) === WETH_ADDRESS
      ? genericAssets['eth']
      : genericAssets[toLower(newData.token1.id)] || newData.token1;
  const tokens = [token0, token1];

  return {
    ...newData,
    address: newData.id,
    liquidity: Number(Number(newData.reserveUSD).toFixed(2)),
    symbol: 'UNI-V2',
    tokenNames: `${newData.token0.symbol}-${newData.token1.symbol}`.replace(
      'WETH',
      'ETH'
    ),
    tokens,
    type: 'uniswap-v2',
    uniqueId: newData.id,
  };
}

/**
 * gets the amoutn difference plus the % change in change itself (second order change)
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 * @param {*} value48HoursAgo
 */
export const get2DayPercentChange = (
  valueNow,
  value24HoursAgo,
  value48HoursAgo
) => {
  // get volume info for both 24 hour periods
  let currentChange = parseFloat(valueNow) - parseFloat(value24HoursAgo);
  let previousChange =
    parseFloat(value24HoursAgo) - parseFloat(value48HoursAgo);

  const adjustedPercentChange =
    (parseFloat(currentChange - previousChange) / parseFloat(previousChange)) *
    100;

  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return [currentChange, 0];
  }
  return [currentChange, adjustedPercentChange];
};

export const calculateProfit30d = (
  data,
  valueOneMonthAgo,
  ethPriceNow,
  ethPriceOneMonthAgo
) => {
  const now = calculateLPTokenPrice(data, ethPriceNow);

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

export default function useUniswapPools(sortField, sortDirection) {
  const { charts } = useSelector(({ charts: { charts } }) => ({
    charts,
  }));

  const ethereumPriceOneMonthAgo = useMemo(
    () => get(charts, `[${ETH_ADDRESS}][${ChartTypes.month}][0][1]`, 0),
    [charts]
  );

  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));
  const [ids, setIds] = useState();
  const [pairs, setPairs] = useState();
  const dispatch = useDispatch();
  const { assetsSocket } = useSelector(({ data: { assetsSocket } }) => ({
    assetsSocket,
  }));

  const { data: idsData } = useQuery(UNISWAP_PAIRS_ID_QUERY, {
    client: uniswapClient,
    pollInterval: UNISWAP_QUERY_INTERVAL,
    variables: {},
  });

  const { data, error, loading } = useQuery(UNISWAP_PAIRS_ID_QUERY, {
    client: uniswapClient,
    skip: !ids,
    variables: { allPairs: ids },
  });

  useEffect(() => {
    if (!ids && idsData?.pairs) {
      setIds(idsData.pairs.map(item => item.id));
    }
  }, [ids, idsData]);

  const fetchPairsData = useCallback(async () => {
    // get data for every pair in list
    const priceOfEther = ethereumUtils.getEthPriceUnit();
    try {
      let topPairs = await getBulkPairData(
        ids,
        Number(priceOfEther),
        Number(ethereumPriceOneMonthAgo),
        genericAssets
      );
      setPairs(topPairs);
    } catch (e) {
      logger.log('🦄🦄🦄 error getting pairs data', e);
    }
  }, [ethereumPriceOneMonthAgo, genericAssets, ids]);

  useEffect(() => {
    if (ids && !pairs) {
      fetchPairsData();
    }
  }, [
    assetsSocket,
    data,
    dispatch,
    error,
    fetchPairsData,
    ids,
    loading,
    pairs,
  ]);

  const top40PairsSorted = useMemo(() => {
    if (!pairs) return null;
    let sortedPairs = sortBy(pairs, sortField);
    if (sortDirection === SORT_DIRECTION.DESC) {
      sortedPairs = sortedPairs.reverse();
    }

    // top 40
    sortedPairs = sortedPairs.slice(0, 19);

    const tmpAllTokens = [];
    sortedPairs.forEach(pair => {
      tmpAllTokens.push(toLower(pair.token0.id));
      tmpAllTokens.push(toLower(pair.token1.id));
    });
    const allTokens = uniq(tmpAllTokens);
    const allLPTokens = sortedPairs.map(({ id }) => id);
    dispatch(emitAssetRequest(allTokens.concat(allLPTokens)));
    return sortedPairs;
  }, [dispatch, pairs, sortDirection, sortField]);

  return {
    error,
    pairs: top40PairsSorted,
  };
}
