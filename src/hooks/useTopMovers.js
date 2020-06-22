import { get, isEmpty, map, slice } from 'lodash';
import { useCallback } from 'react';
import { queryCache, useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import {
  saveTopMovers,
  TOP_MOVERS_FROM_STORAGE,
} from '../handlers/localstorage/topMovers';
import { apiGetTopMovers } from '../handlers/topMovers';

const TOP_MOVERS_PER_ROW_MAX = 5;
const TOP_MOVERS_PER_ROW_MIN = 3;
const TOP_MOVERS_INTERVAL_IN_MS = 12 * 60 * 1000; // 12 mins

const updatePriceAndExchangeAddress = (movers, genericAssets, uniswapPairs) => {
  if (movers.length < TOP_MOVERS_PER_ROW_MIN) return [];
  const topMovers = slice(movers, 0, TOP_MOVERS_PER_ROW_MAX);
  return map(topMovers, mover => {
    const price = get(genericAssets, `${mover.address}.price`);
    const exchangeAddress = get(
      uniswapPairs,
      `${mover.address}.exchangeAddress`
    );
    return {
      ...mover,
      exchangeAddress,
      fallbackPrice: mover.price,
      price,
    };
  });
};

export default function useTopMovers() {
  const { genericAssets, pairs: uniswapPairs } = useSelector(
    ({ data: { genericAssets }, uniswap: { pairs } }) => ({
      genericAssets,
      pairs,
    })
  );

  const fetchTopMovers = useCallback(async () => {
    const topMovers = await apiGetTopMovers();
    const { gainers: gainersData, losers: losersData } = topMovers;

    const gainers = updatePriceAndExchangeAddress(
      gainersData,
      genericAssets,
      uniswapPairs
    );
    const losers = updatePriceAndExchangeAddress(
      losersData,
      genericAssets,
      uniswapPairs
    );

    saveTopMovers({ gainers, losers });
    return { gainers, losers };
  }, [genericAssets, uniswapPairs]);

  const { data } = useQuery(
    !isEmpty(genericAssets) && ['topMovers'],
    fetchTopMovers,
    {
      refetchInterval: TOP_MOVERS_INTERVAL_IN_MS,
    }
  );

  const resultFromStorage = queryCache.getQueryData(TOP_MOVERS_FROM_STORAGE);

  if (!data && !isEmpty(resultFromStorage)) {
    return resultFromStorage;
  }

  if (!data) {
    return {};
  }

  return data;
}
