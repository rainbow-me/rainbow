import { getUnixTime, startOfMinute, sub } from 'date-fns';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uniswapClient } from '../apollo/client';
import {
  UNISWAP_ADDITIONAL_POOL_DATA,
  UNISWAP_PAIR_DATA_QUERY_VOLUME,
} from '../apollo/queries';
import useAccountSettings from './useAccountSettings';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { get2DayPercentChange } from './useUniswapPools';
import { bigNumberFormat } from '@rainbow-me/helpers/bigNumberFormat';
import { setPoolsDetails } from '@rainbow-me/redux/uniswapLiquidity';
import { ethereumUtils, getBlocksFromTimestamps } from '@rainbow-me/utils';

function cutIfOver10000(value) {
  return value > 10000 ? Math.round(value) : value;
}

const getTimestampsForChanges = () => {
  const t1 = getUnixTime(startOfMinute(sub(Date.now(), { days: 1 })));
  const t2 = getUnixTime(startOfMinute(sub(Date.now(), { days: 2 })));
  return [t1, t2];
};

async function fetchPoolDetails(address, dispatch) {
  const result = await uniswapClient.query({
    query: UNISWAP_ADDITIONAL_POOL_DATA,
    variables: {
      address,
    },
  });

  // uniswap v2 graph for the volume

  const pair = result?.data?.pairs?.[0];

  if (pair) {
    const partialData = {
      liquidity: Number(Number(pair.reserveUSD).toFixed(2)),
      oneDayVolumeUSD: parseFloat(pair.volumeUSD),
      partial: true,
    };
    const [t1, t2] = getTimestampsForChanges();
    const [{ number: b1 }, { number: b2 }] = await getBlocksFromTimestamps([
      t1,
      t2,
    ]);

    const oneDayResult = await uniswapClient.query({
      fetchPolicy: 'cache-first',
      query: UNISWAP_PAIR_DATA_QUERY_VOLUME(address, b1),
    });
    const twoDayResult = await uniswapClient.query({
      fetchPolicy: 'cache-first',
      query: UNISWAP_PAIR_DATA_QUERY_VOLUME(address, b2),
    });

    const oneDayHistory = oneDayResult?.data?.pairs[0];
    const twoDayHistory = twoDayResult?.data?.pairs[0];

    const [oneDayVolumeUSD] = get2DayPercentChange(
      pair.volumeUSD,
      oneDayHistory?.volumeUSD ? oneDayHistory.volumeUSD : 0,
      twoDayHistory?.volumeUSD ? twoDayHistory.volumeUSD : 0
    );

    partialData.oneDayVolumeUSD = oneDayVolumeUSD;

    if (!oneDayHistory || !twoDayHistory) {
      partialData.oneDayVolumeUSD = parseFloat(pair.volumeUSD);
    }

    const priceOfEther = ethereumUtils.getEthPriceUnit();
    const trackedReserveUSD = pair.trackedReserveETH * priceOfEther;
    partialData.annualized_fees =
      (partialData.oneDayVolumeUSD * 0.003 * 365 * 100) / trackedReserveUSD;

    dispatch(
      setPoolsDetails({
        [address]: partialData,
      })
    );
  }
}

export default function usePoolDetails(address) {
  const { nativeCurrency } = useAccountSettings();
  const rate = useNativeCurrencyToUSD();

  const format = useCallback(
    value =>
      value
        ? bigNumberFormat(cutIfOver10000(value), nativeCurrency, value >= 10000)
        : '',
    [nativeCurrency]
  );

  const poolDetails = useSelector(state => state.uniswapLiquidity.poolsDetails);

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
