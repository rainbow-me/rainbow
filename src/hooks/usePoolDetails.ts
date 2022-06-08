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
import { getOneDayVolume } from './useUniswapPools';
import { bigNumberFormat } from '@rainbow-me/helpers/bigNumberFormat';
import { setPoolsDetails } from '@rainbow-me/redux/uniswapLiquidity';
import { ethereumUtils, getBlocksFromTimestamps } from '@rainbow-me/utils';

function cutIfOver10000(value) {
  return value > 10000 ? Math.round(value) : value;
}

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
    };
    const t1 = getUnixTime(startOfMinute(sub(Date.now(), { days: 1 })));
    const [{ number: b1 }] = await getBlocksFromTimestamps([t1]);

    const oneDayResult = await uniswapClient.query({
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
