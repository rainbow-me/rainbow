import { sortBy, toLower } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useEthUSDMonthChart, useEthUSDPrice } from '../utils/ethereumUtils';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { getUniswapV2Pools } from '@rainbow-me/handlers/dispersion';
import { pickShallow } from '@rainbow-me/helpers/utilities';
import {
  emitAssetRequest,
  emitChartsRequest,
} from '@rainbow-me/redux/explorer';
import { setPoolsDetails } from '@rainbow-me/redux/uniswapLiquidity';
import { WETH_ADDRESS } from '@rainbow-me/references';
import logger from 'logger';
const AMOUNT_OF_PAIRS_TO_DISPLAY = 40;

export const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
};

export const REFETCH_INTERVAL = 600000;

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

  const { id, name, symbol } = newData.token0;
  const {
    id: idToken1,
    name: nameToken1,
    symbol: symbolToken1,
  } = newData.token1;
  return {
    address: newData?.id,
    annualized_fees: newData.annualized_fees,
    liquidity: Number(Number(newData.reserveUSD).toFixed(2)),
    oneDayVolumeUSD: newData.oneDayVolumeUSD,
    profit30d: newData.profit30d,
    symbol: 'UNI-V2',
    token0: { id, name, symbol },
    token1: { id: idToken1, name: nameToken1, symbol: symbolToken1 },
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
  const walletReady = useSelector(
    ({ appState: { walletReady } }) => walletReady
  );

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

  const { data: poolData, error } = useQuery(
    ['pools/uniswap/v2', token],
    () => getUniswapV2Pools(token),
    {
      enabled: walletReady,
      onError: () => logger.log('🦄🦄🦄 error getting pairs data', error),
      refetchInterval: REFETCH_INTERVAL,
    }
  );

  const handleGetUniswapV2PoolsResponse = useCallback(() => {
    if (!poolData) return;
    const topPairs = poolData.map(
      ({ pair, oneDayBlock, oneDayHistory, oneMonthHistory }) => {
        return parseData(
          pair,
          oneDayHistory,
          oneMonthHistory,
          priceOfEther,
          ethereumPriceOneMonthAgo,
          oneDayBlock
        );
      }
    );
    setPairs(topPairs);
  }, [poolData, priceOfEther, ethereumPriceOneMonthAgo]);

  useEffect(() => {
    if (poolData && priceOfEther && ethereumPriceOneMonthAgo) {
      handleGetUniswapV2PoolsResponse();
    }
  }, [
    poolData,
    ethereumPriceOneMonthAgo,
    handleGetUniswapV2PoolsResponse,
    priceOfEther,
  ]);

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

      return pickShallow(pairAdjustedForCurrency, [
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
    isEmpty: top40PairsSorted && top40PairsSorted.length < 1,
    pairs: top40PairsSorted,
  };
}
