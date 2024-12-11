import { useEffect, useRef, useCallback } from 'react';
import { estimateGas, toHex } from '@/handlers/web3';
import { convertHexToString, omitFlatten } from '@/helpers/utilities';
import { logger, RainbowError } from '@/logger';
import { ethereumUtils } from '@/utils';
import { hexToNumber, isHex } from 'viem';
import { isEmpty } from 'lodash';
import { InteractionManager } from 'react-native';
import { GasFeeParamsBySpeed } from '@/entities';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { useGas } from '@/hooks';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

type CalculateGasLimitProps = {
  isMessageRequest: boolean;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed;
  provider: StaticJsonRpcProvider;
  req: any;
  updateTxFee: ReturnType<typeof useGas>['updateTxFee'];
  chainId: ChainId;
};

export const useCalculateGasLimit = ({
  isMessageRequest,
  gasFeeParamsBySpeed,
  provider,
  req,
  updateTxFee,
  chainId,
}: CalculateGasLimitProps) => {
  const calculatingGasLimit = useRef(false);

  const calculateGasLimit = useCallback(async () => {
    calculatingGasLimit.current = true;
    const txPayload = req;
    if (isHex(txPayload?.type)) {
      txPayload.type = hexToNumber(txPayload?.type);
    }
    let gas = txPayload.gasLimit || txPayload.gas;

    try {
      logger.debug('WC: Estimating gas limit', { gas }, logger.DebugContext.walletconnect);
      const cleanTxPayload = omitFlatten(txPayload, ['gas', 'gasLimit', 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']);
      const rawGasLimit = await estimateGas(cleanTxPayload, provider);
      logger.debug('WC: Estimated gas limit', { rawGasLimit }, logger.DebugContext.walletconnect);
      if (rawGasLimit) {
        gas = toHex(rawGasLimit);
      }
    } catch (error) {
      logger.error(new RainbowError('WC: error estimating gas'), { error });
    } finally {
      logger.debug('WC: Setting gas limit to', { gas: convertHexToString(gas) }, logger.DebugContext.walletconnect);

      const needsL1SecurityFee = useBackendNetworksStore.getState().getNeedsL1SecurityFeeChains().includes(chainId);
      if (needsL1SecurityFee) {
        const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(txPayload, provider);
        updateTxFee(gas, null, l1GasFeeOptimism);
      } else {
        updateTxFee(gas, null);
      }
    }
  }, [chainId, req, updateTxFee, provider]);

  useEffect(() => {
    if (!isEmpty(gasFeeParamsBySpeed) && !calculatingGasLimit.current && !isMessageRequest && provider) {
      InteractionManager.runAfterInteractions(() => {
        calculateGasLimit();
      });
    }
  }, [calculateGasLimit, gasFeeParamsBySpeed, isMessageRequest, provider]);

  return { calculateGasLimit };
};
