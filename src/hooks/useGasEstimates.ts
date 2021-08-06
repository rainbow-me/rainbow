import { Transaction } from '@ethersproject/transactions';
import { useEffect, useState } from 'react';
import networkTypes from '@rainbow-me/helpers/networkTypes';

const useGasEstimates = (
  txPayload: Transaction,
  network: string,
  provider: any
): {
  estimatedGas: Object | null;
  blockGasLimit: Object | null;
  toCode: string | null;
} => {
  const [estimatedGas, setEstimatedGas] = useState<Object | null>(null);
  const [blockGasLimit, setBlockGasLimit] = useState<Object | null>(null);
  const [toCode, setToCode] = useState<string | null>(null);

  useEffect(() => {
    const estimatedGas = provider?.estimateGas(txPayload) || null;
    setEstimatedGas(estimatedGas);
  }, [provider, txPayload]);

  useEffect(() => {
    if (!provider || network !== networkTypes.mainnet) return;

    const getCode = async () => {
      const toCode = await provider?.getCode(txPayload.to);
      setToCode(toCode);
    };
    const onBlockCallback = async () => {
      const { gasLimit } = await provider?.getBlock();
      setBlockGasLimit(gasLimit);
    };

    getCode();
    provider?.on('block', onBlockCallback);

    return () => {
      provider?.off('block');
    };
  }, [provider, txPayload.to, network]);

  return { blockGasLimit, estimatedGas, toCode };
};

export default useGasEstimates;
