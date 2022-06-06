import { isEmpty } from 'lodash';
import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { useDispatch } from 'react-redux';
import { emitAssetRequest } from '../redux/explorer';
import useAsset from './useAsset';
import { IndexToken } from '@rainbow-me/entities';
import { getDPIBalance } from '@rainbow-me/handlers/dispersion';
import { DPI_ADDRESS } from '@rainbow-me/references';

export default function useDPI() {
  const dispatch = useDispatch();
  const dpiAssetData = useAsset({ address: DPI_ADDRESS });

  const fetchDPIData = useCallback(async () => {
    const defiPulseData = await getDPIBalance();
    const underlyingAddresses = defiPulseData?.underlying.map(
      (token: IndexToken) => token.address
    );
    if (underlyingAddresses) {
      dispatch(emitAssetRequest(underlyingAddresses));
    }
    return defiPulseData;
  }, [dispatch]);

  const { data } = useQuery(['defiPulse'], fetchDPIData, {
    enabled: !isEmpty(dpiAssetData),
  });

  return data;
}
