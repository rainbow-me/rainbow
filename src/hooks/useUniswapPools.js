import { useQuery } from '@apollo/client';
import { getUnixTime, startOfMinute, sub } from 'date-fns';
import { toLower, uniq } from 'lodash';
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
import { emitAssetRequest } from '@rainbow-me/redux/explorer';
import { WETH_ADDRESS } from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

const UNISWAP_QUERY_INTERVAL = 1000 * 60 * 5; // 5 minutes

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
  const tWeek = getUnixTime(startOfMinute(sub(Date.now(), { week: 1 })));
  return [t1, t2, tWeek];
};

async function getBulkPairData(pairList, ethPrice, genericAssets) {
  const [t1, t2, tWeek] = getTimestampsForChanges();
  let [
    { number: b1 },
    { number: b2 },
    { number: bWeek },
  ] = await getBlocksFromTimestamps([t1, t2, tWeek]);

  try {
    let current = await uniswapClient.query({
      fetchPolicy: 'cache-first',
      query: UNISWAP_PAIRS_BULK_QUERY,
      variables: {
        allPairs: pairList,
      },
    });

    let [oneDayResult, twoDayResult, oneWeekResult] = await Promise.all(
      [b1, b2, bWeek].map(async block => {
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

    let oneWeekData = oneWeekResult?.data?.pairs.reduce((obj, cur) => {
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
          let oneWeekHistory = oneWeekData?.[pair.id];
          if (!oneWeekHistory) {
            let newData = await uniswapClient.query({
              fetchPolicy: 'cache-first',
              query: UNISWAP_PAIR_DATA_QUERY(pair.id, bWeek),
            });
            oneWeekHistory = newData.data.pairs[0];
          }
          data = parseData(
            data,
            oneDayHistory,
            twoDayHistory,
            oneWeekHistory,
            ethPrice,
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
  oneWeekData,
  ethPrice,
  oneDayBlock,
  genericAssets
) {
  // get volume changes
  const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
    data?.volumeUSD,
    oneDayData?.volumeUSD ? oneDayData.volumeUSD : 0,
    twoDayData?.volumeUSD ? twoDayData.volumeUSD : 0
  );
  const [oneDayVolumeUntracked, volumeChangeUntracked] = get2DayPercentChange(
    data?.untrackedVolumeUSD,
    oneDayData?.untrackedVolumeUSD
      ? parseFloat(oneDayData?.untrackedVolumeUSD)
      : 0,
    twoDayData?.untrackedVolumeUSD ? twoDayData?.untrackedVolumeUSD : 0
  );

  const oneWeekVolumeUSD = parseFloat(
    oneWeekData ? data?.volumeUSD - oneWeekData?.volumeUSD : data.volumeUSD
  );

  const oneWeekVolumeUntracked = parseFloat(
    oneWeekData
      ? data?.untrackedVolumeUSD - oneWeekData?.untrackedVolumeUSD
      : data.untrackedVolumeUSD
  );

  // set volume properties
  data.oneDayVolumeUSD = parseFloat(oneDayVolumeUSD);
  data.oneWeekVolumeUSD = oneWeekVolumeUSD;
  data.volumeChangeUSD = volumeChangeUSD;
  data.oneDayVolumeUntracked = oneDayVolumeUntracked;
  data.oneWeekVolumeUntracked = oneWeekVolumeUntracked;
  data.volumeChangeUntracked = volumeChangeUntracked;

  // set liquidity properties
  data.trackedReserveUSD = data.trackedReserveETH * ethPrice;
  data.liquidityChangeUSD = getPercentChange(
    data.reserveUSD,
    oneDayData?.reserveUSD
  );

  // format if pair hasnt existed for a day or a week
  if (!oneDayData && data && data.createdAtBlockNumber > oneDayBlock) {
    data.oneDayVolumeUSD = parseFloat(data.volumeUSD);
  }
  if (!oneDayData && data) {
    data.oneDayVolumeUSD = parseFloat(data.volumeUSD);
  }
  if (!oneWeekData && data) {
    data.oneWeekVolumeUSD = parseFloat(data.volumeUSD);
  }

  let token0 =
    (toLower(data.token0.id) === WETH_ADDRESS
      ? genericAssets['eth']
      : genericAssets[toLower(data.token0.id)]) || data.token0;
  let token1 =
    toLower(data.token1.id) === WETH_ADDRESS
      ? genericAssets['eth']
      : genericAssets[toLower(data.token0.id)] || data.token1;
  const tokens = [token0, token1];

  return {
    ...data,
    address: data.id,
    liquidity: Number(Number(data.reserveUSD).toFixed(2)),
    symbol: 'UNI-V2',
    tokenNames: `${data.token0.symbol}-${data.token1.symbol}`.replace(
      'WETH',
      'ETH'
    ),
    tokens,
    type: 'uniswap-v2',
    uniqueId: data.id,
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

export default function useUniswapPools() {
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
        genericAssets
      );
      setPairs(topPairs);
      const tmpAllTokens = [];
      topPairs.forEach(pair => {
        tmpAllTokens.push(toLower(pair.token0.id));
        tmpAllTokens.push(toLower(pair.token1.id));
      });
      const allTokens = uniq(tmpAllTokens);
      dispatch(emitAssetRequest(allTokens));
      logger.log('🦄🦄🦄 GUCCI');
    } catch (e) {
      logger.log('🦄🦄🦄 FUCK', e);
    }
  }, [dispatch, genericAssets, ids]);

  useEffect(() => {
    if (ids) {
      fetchPairsData();
    }
    if (error) {
      logger.log('🦄🦄🦄 GOT OG ERROR', error);
    }
    if (loading) {
      logger.log('🦄🦄🦄 GOT OG LOADING', loading);
    }
  }, [assetsSocket, data, dispatch, error, fetchPairsData, ids, loading]);

  return {
    error,
    loading,
    pairs,
  };
}
