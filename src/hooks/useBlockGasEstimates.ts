import { Transaction } from '@ethersproject/transactions';
import { useEffect, useMemo, useState } from 'react';
import { calculateGasWithPadding } from '@rainbow-me/handlers/web3';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { isMessageDisplayType } from '@rainbow-me/utils/signingMethods';

const useBlockGasEstimates = (
  txPayload: Transaction,
  method: string,
  network: string,
  provider: any
): {
  estimatedGas: Object | null;
} => {
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [blockGasLimit, setBlockGasLimit] = useState<Object | null>(null);
  const [toCode, setToCode] = useState<string | null>(null);

  const isBasicTransaction = useMemo(
    () =>
      !txPayload.to ||
      (txPayload.to && !txPayload.data && (!toCode || toCode === '0x')),
    [txPayload.to, txPayload.data, toCode]
  );

  const shouldListenBlocks = useMemo(
    () =>
      !isMessageDisplayType(method) &&
      provider &&
      network === networkTypes.mainnet,
    [provider, method, network]
  );

  useEffect(() => {
    if (!shouldListenBlocks || !blockGasLimit) return;
    const runCalculations = async () => {
      const estimatedGas = await calculateGasWithPadding(
        txPayload,
        provider,
        blockGasLimit,
        toCode
      );
      setEstimatedGas(estimatedGas);
    };
    runCalculations();
  }, [blockGasLimit, provider, shouldListenBlocks, toCode, txPayload]);

  useEffect(() => {
    if (!shouldListenBlocks) return;

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
  }, [shouldListenBlocks, txPayload.to, provider, isBasicTransaction]);

  return { estimatedGas };
};

export default useBlockGasEstimates;
