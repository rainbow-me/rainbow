import { useQuery } from '@tanstack/react-query';
import { isEmpty } from 'lodash';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { emitAssetRequest } from '../redux/explorer';
import { AppState } from '../redux/store';
import { IndexToken } from '@/entities';
import { getDPIBalance } from '@/handlers/dispersion';

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
    return defiPulseData ?? null;
  }, [dispatch]);

  const { data } = useQuery(['defiPulse'], fetchDPIData, {
    enabled: !isEmpty(genericAssets),
  });

  return data;
}
