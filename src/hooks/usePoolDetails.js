import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uniswapClient } from '../apollo/client';
import { UNISWAP_ADDITIONAL_POOL_DATA } from '../apollo/queries';
import { bigNumberFormat } from '../components/investment-cards/PoolValue';
import useAccountSettings from './useAccountSettings';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';
import { setPoolsDetails } from '@rainbow-me/redux/uniswapLiquidity';
import { ethereumUtils } from '@rainbow-me/utils';

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

  const pair = result?.data?.pairs?.[0];

  if (pair) {
    const partialData = {
      liquidity: Number(Number(pair.reserveUSD).toFixed(2)),
      oneDayVolumeUSD: parseFloat(pair.volumeUSD),
      partial: true,
    };
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
      bigNumberFormat(cutIfOver10000(value), nativeCurrency, value >= 10000),
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
    nativeCurrency,
    rate,
  ]);

  return {
    ...data,
    nativeLiquidity,
    volume,
  };
}
