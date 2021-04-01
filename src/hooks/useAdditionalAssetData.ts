import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  additionalAssetsDataAdd,
  AdditionalData,
} from '@rainbow-me/redux/additionalAssetsData';

import type { AppState } from '@rainbow-me/redux/store';

export default function useAdditionalAssetData(
  address: string
): AdditionalData | undefined {
  // @ts-ignore
  const data: AdditionalData | undefined = useSelector(
    // @ts-ignore
    ({ additionalAssetsData }): AppState =>
      additionalAssetsData[address?.toLowerCase()].data
  );

  const dispatch = useDispatch();

  useEffect(() => {
    !data && dispatch(additionalAssetsDataAdd(address?.toLowerCase()));
  }, [data, address, dispatch]);

  return data || {};
}
