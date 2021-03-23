import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { isEmpty, map } from 'lodash';
import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { web3Provider } from '../handlers/web3';
import { emitAssetRequest } from '../redux/explorer';
import { AppState } from '../redux/store';
import { IndexToken } from '@rainbow-me/entities';
import {
  DEFI_SDK_ADAPTER_REGISTRY_ADDRESS,
  defiSdkAdapterRegistryABI,
  DPI_ADDRESS,
} from '@rainbow-me/references';

const TOKENSETS_V2 = 'SetToken V2';

interface Token {
  amount: BigNumber;
  metadata: {
    token: string;
    decimals: number;
    name: string;
    symbol: string;
  };
}

const getTokenData = (token: Token): IndexToken => {
  return {
    address: token?.metadata?.token,
    amount: token?.amount?.toString(),
    decimals: token?.metadata?.decimals,
    name: token?.metadata?.name,
    symbol: token?.metadata?.symbol,
  };
};

export default function useDPI() {
  const dispatch = useDispatch();
  const genericAssets = useSelector(
    ({ data: { genericAssets } }: AppState) => genericAssets
  );

  const fetchDPIData = useCallback(async () => {
    const adapterRegistry = new Contract(
      DEFI_SDK_ADAPTER_REGISTRY_ADDRESS,
      defiSdkAdapterRegistryABI,
      web3Provider
    );
    const result = await adapterRegistry.getFinalFullTokenBalance(
      TOKENSETS_V2,
      DPI_ADDRESS
    );
    const defiPulseData = {
      base: getTokenData(result.base),
      underlying: map(result.underlying, token => getTokenData(token)),
    };
    const underlyingAddresses = defiPulseData.underlying.map(
      token => token.address
    );
    dispatch(emitAssetRequest(underlyingAddresses));
    return defiPulseData;
  }, [dispatch]);

  const { data } = useQuery(
    !isEmpty(genericAssets) && ['defiPulse'],
    fetchDPIData
  );

  return data;
}
