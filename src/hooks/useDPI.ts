import { isEmpty } from 'lodash';
import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { emitAssetRequest } from '../redux/explorer';
import { AppState } from '../redux/store';
import { IndexToken } from '@rainbow-me/entities';
import { getDPIBalance } from '@rainbow-me/handlers/dispersion';

export default function useDPI() {
  const dispatch = useDispatch();
  const genericAssets = useSelector(
    ({ data: { genericAssets } }: AppState) => genericAssets
  );

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
    enabled: !isEmpty(genericAssets),
  });

  return data;
}
