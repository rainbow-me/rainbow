import { RainbowError, logger } from '@/logger';
import { greaterThan, convertHexToString } from './utilities';
import { isNil } from 'lodash';
import { estimateGasWithPadding, toHex } from '@/handlers/web3';
import { StaticJsonRpcProvider, TransactionRequest } from '@ethersproject/providers';
import { SelectedGasFee } from '@/entities';
import { parseGasParamsForTransaction } from '@/parsers';
import { getNextNonce } from '@/state/nonces';
import { ChainId } from '@/state/backendNetworks/types';
import { hexToNumber } from 'viem';

export const getGasLimitForSuggestedGas = async (params: any, provider: StaticJsonRpcProvider) => {
  const gasLimitFromPayload = params.gasLimit;
  let gas = params.gas;
  try {
    logger.debug(
      '[SignTransactionSheet]: gas suggested by dapp',
      {
        gas: convertHexToString(gas),
        gasLimitFromPayload: convertHexToString(gasLimitFromPayload),
      },
      logger.DebugContext.walletconnect
    );

    // Estimate the tx with gas limit padding before sending
    const rawGasLimit = await estimateGasWithPadding(params, null, null, provider);
    if (!rawGasLimit) {
      logger.error(new RainbowError('[SignTransactionSheet]: error estimating gas'), {
        rawGasLimit,
      });
      return;
    }

    // If the estimation with padding is higher or gas limit was missing,
    // let's use the higher value
    if (
      (isNil(gas) && isNil(gasLimitFromPayload)) ||
      (!isNil(gas) && greaterThan(rawGasLimit, convertHexToString(gas))) ||
      (!isNil(gasLimitFromPayload) && greaterThan(rawGasLimit, convertHexToString(gasLimitFromPayload)))
    ) {
      logger.debug('[SignTransactionSheet]: using padded estimation!', { gas: rawGasLimit.toString() }, logger.DebugContext.walletconnect);
      gas = toHex(rawGasLimit);
    }
  } catch (error) {
    logger.error(new RainbowError('[SignTransactionSheet]: error estimating gas'), { error });
  }
  return gas || gasLimitFromPayload;
};

export const buildTransaction = async <T extends Partial<TransactionRequest>>({
  address,
  chainId,
  params,
  selectedGasFee,
  provider,
}: {
  address: string;
  chainId: ChainId;
  params: T;
  selectedGasFee: SelectedGasFee;
  provider: StaticJsonRpcProvider;
}) => {
  const gasLimit = await getGasLimitForSuggestedGas(params, provider);
  const gasParams = parseGasParamsForTransaction(selectedGasFee);
  const nonce = await getNextNonce({ address, chainId });

  const { type, to, from, data, value } = params;

  const baseTxn: TransactionRequest = {
    ...gasParams,
    ...(gasLimit && { gasLimit }),
    type: type && typeof type === 'string' ? hexToNumber(type) : undefined,
    to,
    from,
    data: data || '0x',
    value,
    nonce,
  };

  return baseTxn;
};
