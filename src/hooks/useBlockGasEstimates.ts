import { Transaction } from '@ethersproject/transactions';
import { useEffect, useMemo, useState } from 'react';
import { estimateGasWithPadding } from '@rainbow-me/handlers/web3';
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

  const isMainnet = useMemo(() => network === networkTypes.mainnet, [network]);

  const isBasicTransaction = useMemo(
    () =>
      !txPayload.to ||
      (txPayload.to && !txPayload.data && (!toCode || toCode === '0x')),
    [txPayload.to, txPayload.data, toCode]
  );

  // we don't don't need gas estimates if no provider
  // it's a message request or is not mainnet
  const shouldGetEstimates = useMemo(
    () => !isMessageDisplayType(method) && provider && isMainnet,
    [provider, method, isMainnet]
  );

  useEffect(() => {
    if (!shouldGetEstimates) return;
    const runCalculations = async () => {
      const estimatedGas = await estimateGasWithPadding(
        txPayload,
        provider,
        { blockGasLimit, receiverCode: toCode }
      )
      setEstimatedGas(estimatedGas);
    };
    runCalculations();
  }, [blockGasLimit, provider, shouldGetEstimates, toCode, txPayload]);

  useEffect(() => {
    // if is a basic transaction, we send a default value
    if (!shouldGetEstimates || isBasicTransaction) return;

    const getCode = async () => {
      const toCode = await provider?.getCode(txPayload.to);
      setToCode(toCode);
    };
    const onBlockCallback = async () => {
      const { gasLimit } = await provider?.getBlock();
      setBlockGasLimit({gasLimit});
    };

    getCode();
    provider?.on('block', onBlockCallback);

    return () => {
      provider?.off('block');
    };
  }, [shouldGetEstimates, txPayload.to, provider, isBasicTransaction]);

  return { estimatedGas };
};

export default useBlockGasEstimates;
