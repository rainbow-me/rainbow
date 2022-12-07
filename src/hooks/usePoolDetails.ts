import { getUnixTime, startOfMinute, sub } from 'date-fns';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uniswapClientDeprecated } from '../apollo/client';
import { UNISWAP_PAIR_DATA_QUERY_VOLUME } from '../apollo/queries';
import useAccountSettings from './useAccountSettings';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { bigNumberFormat } from '@/helpers/bigNumberFormat';
import { AppDispatch, AppState } from '@/redux/store';
import { setPoolsDetails } from '@/redux/uniswapLiquidity';
import { ethereumUtils, getBlocksFromTimestamps } from '@/utils';
import { uniswapClient } from '@/graphql';

function cutIfOver10000(value: number) {
  return value > 10000 ? Math.round(value) : value;
}

function getOneDayVolume(
  valueNow: string | number,
  value24HoursAgo: string | number
) {
  return parseFloat(valueNow as string) - parseFloat(value24HoursAgo as string);
}

async function fetchPoolDetails(address: string, dispatch: AppDispatch) {
  const result = await uniswapClient.getAdditionalPoolData({ address });

  // uniswap v2 graph for the volume

  const pair = result?.pairs?.[0];

  if (pair) {
    const partialData = {
      liquidity: Number(Number(pair.reserveUSD).toFixed(2)),
      oneDayVolumeUSD: parseFloat(pair.volumeUSD),
    };
    const t1 = getUnixTime(startOfMinute(sub(Date.now(), { days: 1 })));
    const [{ number: b1 }] = await getBlocksFromTimestamps([t1]);

    // TODO(jxom): migrate this to React Query's `fetchQuery` w/ cacheTime=Infinite.
    const oneDayResult = await uniswapClientDeprecated.query({
      fetchPolicy: 'cache-first',
      query: UNISWAP_PAIR_DATA_QUERY_VOLUME(address, b1),
    });

    const oneDayHistory = oneDayResult?.data?.pairs[0];

    if (oneDayHistory) {
      const oneDayVolumeUSD = getOneDayVolume(
        pair.volumeUSD,
        oneDayHistory?.volumeUSD ? oneDayHistory.volumeUSD : 0
      );
      partialData.oneDayVolumeUSD = oneDayVolumeUSD;
    }

    const priceOfEther = ethereumUtils.getEthPriceUnit();
    const trackedReserveUSD = pair.trackedReserveETH * priceOfEther;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'annualized_fees' does not exist on type ... Remove this comment to see the full error message
    partialData.annualized_fees =
      (partialData.oneDayVolumeUSD * 0.003 * 365 * 100) / trackedReserveUSD;

    dispatch(
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ [x: number]: { liquidity: numb... Remove this comment to see the full error message
      setPoolsDetails({
        [address]: partialData,
      })
    );
  }
}

export default function usePoolDetails(address: string) {
  const { nativeCurrency } = useAccountSettings();
  const rate = useNativeCurrencyToUSD();

  const format = useCallback(
    value =>
      value
        ? bigNumberFormat(cutIfOver10000(value), nativeCurrency, value >= 10000)
        : '',
    [nativeCurrency]
  );

  const poolDetails = useSelector(
    (state: AppState) => state.uniswapLiquidity.poolsDetails
  );

  const data = poolDetails[address];
  const dispatch = useDispatch();

  useEffect(() => {
    if (poolDetails && !data) {
      // if there are not data, get partial data from the graph
      fetchPoolDetails(address, dispatch);
    }
  }, [address, data, poolDetails, dispatch]);

  const volume = useMemo(() => format(data?.oneDayVolumeUSD * rate), [
    data?.oneDayVolumeUSD,
    format,
    rate,
  ]);
  const nativeLiquidity = useMemo(() => format(data?.liquidity * rate), [
    data?.liquidity,
    format,
    rate,
  ]);

  return {
    ...data,
    nativeLiquidity,
    volume,
  };
}
