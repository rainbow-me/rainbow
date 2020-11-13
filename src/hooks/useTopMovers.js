import { captureMessage } from '@sentry/react-native';
import { get, isEmpty, map, remove, slice, toLower } from 'lodash';
import { useCallback } from 'react';
import { queryCache, useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import {
  saveTopMovers,
  TOP_MOVERS_FROM_STORAGE,
} from '../handlers/localstorage/topMovers';
import { apiGetTopMovers } from '../handlers/topMovers';
import logger from 'logger';

const TOP_MOVERS_PER_ROW_MAX = 12;
const TOP_MOVERS_PER_ROW_MIN = 3;
const TOP_MOVERS_INTERVAL_IN_MS = 12 * 60 * 1000; // 12 mins

const updatePrice = (movers, genericAssets) => {
  if (movers.length < TOP_MOVERS_PER_ROW_MIN) return [];

  const moversWithPrice = map(movers, mover => {
    const price = get(genericAssets, `${toLower(mover.address)}.price.value`);
    return {
      ...mover,
      price,
    };
  });

  const moversWithoutPrice = remove(moversWithPrice, mover => !mover.price);
  if (!isEmpty(moversWithoutPrice)) {
    logger.sentry('Top Movers with price not found', moversWithoutPrice);
    captureMessage(
      'Top Movers - possible discrepancy between CMC and Rainbow token list'
    );
  }

  return slice(moversWithPrice, 0, TOP_MOVERS_PER_ROW_MAX);
};

export default function useTopMovers() {
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));

  const fetchTopMovers = useCallback(async () => {
    const topMovers = await apiGetTopMovers();
    const { gainers: gainersData, losers: losersData } = topMovers;

    const gainers = updatePrice(gainersData, genericAssets);
    const losers = updatePrice(losersData, genericAssets);

    saveTopMovers({ gainers, losers });
    return { gainers, losers };
  }, [genericAssets]);

  const { data } = useQuery(
    !isEmpty(genericAssets) && ['topMovers'],
    fetchTopMovers,
    {
      refetchInterval: TOP_MOVERS_INTERVAL_IN_MS,
    }
  );

  return data || queryCache.getQueryData(TOP_MOVERS_FROM_STORAGE);
}
