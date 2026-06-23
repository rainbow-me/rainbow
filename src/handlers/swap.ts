import { type BigNumberish } from '@ethersproject/bignumber';
import { MaxUint256 } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { type StaticJsonRpcProvider } from '@ethersproject/providers';

import { IS_TEST } from '@/env';
import { getRemoteConfig } from '@/features/config/stores/remoteConfig';
import { ChainId } from '@/features/network/types/backendNetworks';
import { lessThan } from '@/helpers/utilities';
import { logger, RainbowError } from '@/logger';
import erc20ABI from '@/references/erc20-abi.json';
import ethUnits from '@/references/ethereum-units.json';
import ethereumUtils from '@/utils/ethereumUtils';
import { getQuoteExecutionDetails, getTargetAddress, type CrosschainQuote, type Quote } from '@rainbow-me/swaps';

import { estimateGasWithPadding, getProvider, toHexNoLeadingZeros } from './web3';

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

const GAS_LIMIT_INCREMENT = 50000;
const EXTRA_GAS_PADDING = 1.5;
const SWAP_GAS_PADDING = 1.1;
const CHAIN_IDS_WITH_TRACE_SUPPORT = [ChainId.mainnet];

export async function getClosestGasEstimate(estimationFn: (gasEstimate: number) => Promise<boolean>) {
  // From 200k to 1M
  const gasEstimates = Array.from(Array(21).keys())
    .filter(x => x > 3)
    .map(x => x * GAS_LIMIT_INCREMENT);

  let start = 0;
  let end = gasEstimates.length - 1;

  let highestFailedGuess = null;
  let lowestSuccessfulGuess = null;
  let lowestFailureGuess = null;
  // guess is typically middle of array
  let guessIndex = Math.floor((end - start) / 2);
  while (end > start) {
    const gasEstimationSucceded = await estimationFn(gasEstimates[guessIndex]);
    if (gasEstimationSucceded) {
      if (!lowestSuccessfulGuess || guessIndex < lowestSuccessfulGuess) {
        lowestSuccessfulGuess = guessIndex;
      }
      end = guessIndex;
      guessIndex = Math.max(Math.floor((end + start) / 2) - 1, highestFailedGuess || 0);
    } else if (!gasEstimationSucceded) {
      if (!highestFailedGuess || guessIndex > highestFailedGuess) {
        highestFailedGuess = guessIndex;
      }
      if (!lowestFailureGuess || guessIndex < lowestFailureGuess) {
        lowestFailureGuess = guessIndex;
      }
      start = guessIndex;
      guessIndex = Math.ceil((end + start) / 2);
    }

    if (
      (highestFailedGuess !== null && highestFailedGuess + 1 === lowestSuccessfulGuess) ||
      lowestSuccessfulGuess === 0 ||
      (lowestSuccessfulGuess !== null && lowestFailureGuess === lowestSuccessfulGuess - 1)
    ) {
      return gasEstimates[lowestSuccessfulGuess];
    }

    if (highestFailedGuess === gasEstimates.length - 1) {
      return -1;
    }
  }
}

const getCrosschainSwapDefaultGasLimit = (tradeDetails: CrosschainQuote) => tradeDetails?.routes?.[0]?.userTxs?.[0]?.gasFees?.gasLimit;

const getCrosschainSwapRainbowDefaultGasLimit = (chainId: ChainId) =>
  ethereumUtils.getBasicSwapGasLimit(Number(chainId)) * EXTRA_GAS_PADDING;

export const getDefaultGasLimitForTrade = (tradeDetails: Quote, chainId: ChainId): number => {
  const defaultGasLimit = tradeDetails?.defaultGasLimit;
  return Number(defaultGasLimit || 0) || ethereumUtils.getBasicSwapGasLimit(Number(chainId)) * EXTRA_GAS_PADDING;
};

export type StateDiff = {
  [x: string]: {
    stateDiff: {
      [x: string]: string;
    };
  };
};

export async function getStateDiff(provider: StaticJsonRpcProvider, tradeDetails: Quote): Promise<StateDiff | undefined> {
  const tokenAddress = tradeDetails.sellTokenAddress;
  const fromAddr = tradeDetails.from;
  const toAddr = getTargetAddress(tradeDetails);
  const tokenContract = new Contract(tokenAddress, erc20ABI, provider);
  const { number: blockNumber } = await provider.getBlock('latest');

  // Get data
  const { data } = await tokenContract.populateTransaction.approve(toAddr, MaxUint256.toHexString());
  const { trace_call_block_number_offset } = getRemoteConfig();
  // trace_call default params
  const callParams = [
    {
      data,
      from: fromAddr,
      to: tokenAddress,
      value: '0x0',
    },
    ['stateDiff'],
    blockNumber - Number(trace_call_block_number_offset || 20),
  ];

  const trace = await provider.send('trace_call', callParams);

  if (trace.stateDiff) {
    const slotAddress = Object.keys(trace.stateDiff[tokenAddress]?.storage)?.[0];
    if (slotAddress) {
      const formattedStateDiff = {
        [tokenAddress]: {
          stateDiff: {
            [slotAddress]: MaxUint256.toHexString(),
          },
        },
      };
      return formattedStateDiff;
    }
  }
  logger.debug('[swap]: Couldnt get stateDiff...', {
    trace,
  });
}

export const getSwapGasLimitWithFakeApproval = async (
  chainId: number,
  provider: StaticJsonRpcProvider,
  tradeDetails: Quote
): Promise<number> => {
  let stateDiff: StateDiff | undefined;

  try {
    stateDiff = await getStateDiff(provider, tradeDetails);
    const { router, methodName, params, methodArgs } = getQuoteExecutionDetails(tradeDetails, { from: tradeDetails.from }, provider);

    let data;
    if (tradeDetails.fallback) {
      data = tradeDetails.data;
    } else {
      const result = await router.populateTransaction[methodName](...(methodArgs ?? []), params);
      data = result.data;
    }

    const gasLimit = await getClosestGasEstimate(async (gas: number) => {
      const callParams = [
        {
          data,
          from: tradeDetails.from,
          gas: toHexNoLeadingZeros(gas),
          gasPrice: toHexNoLeadingZeros(`100000000000`),
          to: getTargetAddress(tradeDetails),
          value: '0x0', // 100 gwei
        },
        'latest',
      ];

      try {
        await provider.send('eth_call', [...callParams, stateDiff]);
        logger.debug('[swap]: Estimate worked with gasLimit', {
          gas,
        });
        return true;
      } catch (e) {
        logger.debug('[swap]: Estimate failed with gasLimit', {
          gas,
        });
        return false;
      }
    });
    if (gasLimit && gasLimit >= ethUnits.basic_swap) {
      return gasLimit;
    } else {
      logger.debug('[swap]: Could not find a gas estimate');
    }
  } catch (e) {
    logger.error(new RainbowError('[swap]: Blew up trying to get state diff. Falling back to defaults'), {
      error: e,
    });
  }
  return getDefaultGasLimitForTrade(tradeDetails, chainId);
};

export const estimateCrosschainSwapGasLimit = async ({
  chainId,
  requiresApprove,
  tradeDetails,
}: {
  chainId: number;
  requiresApprove?: boolean;
  tradeDetails: CrosschainQuote;
}): Promise<string | number> => {
  const provider = getProvider({ chainId });
  if (!provider || !tradeDetails) {
    return ethereumUtils.getBasicSwapGasLimit(Number(chainId));
  }
  try {
    if (requiresApprove) {
      if (CHAIN_IDS_WITH_TRACE_SUPPORT.includes(chainId) && !IS_TEST) {
        try {
          const gasLimitWithFakeApproval = await getSwapGasLimitWithFakeApproval(chainId, provider, tradeDetails);
          logger.debug('[swap]: Got gasLimitWithFakeApproval!', {
            gasLimitWithFakeApproval,
          });
          return gasLimitWithFakeApproval;
        } catch (e) {
          logger.error(new RainbowError('[swap]: Error estimating swap gas limit with approval'), {
            error: e,
          });
        }
      }

      const routeGasLimit = getCrosschainSwapDefaultGasLimit(tradeDetails);
      const rainbowDefaultGasLimit = getCrosschainSwapRainbowDefaultGasLimit(chainId);
      if (routeGasLimit && lessThan(rainbowDefaultGasLimit, routeGasLimit)) {
        return routeGasLimit;
      }
      return rainbowDefaultGasLimit;
    }

    const gasLimit = await estimateGasWithPadding(
      {
        data: tradeDetails.data,
        from: tradeDetails.from,
        to: tradeDetails.to,
        value: tradeDetails.value,
      },
      null,
      null,
      provider,
      SWAP_GAS_PADDING
    );
    const routeGasLimit = getCrosschainSwapDefaultGasLimit(tradeDetails);
    const rainbowDefaultGasLimit = getCrosschainSwapRainbowDefaultGasLimit(chainId);

    let fallbackGasLimit: BigNumberish = rainbowDefaultGasLimit;
    if (routeGasLimit && lessThan(rainbowDefaultGasLimit, routeGasLimit)) {
      fallbackGasLimit = routeGasLimit;
    }
    return gasLimit || fallbackGasLimit;
  } catch (error) {
    const routeGasLimit = getCrosschainSwapDefaultGasLimit(tradeDetails);
    const rainbowDefaultGasLimit = getCrosschainSwapRainbowDefaultGasLimit(chainId);

    let fallbackGasLimit: BigNumberish = rainbowDefaultGasLimit;
    if (routeGasLimit && lessThan(rainbowDefaultGasLimit, routeGasLimit)) {
      fallbackGasLimit = routeGasLimit;
    }
    return fallbackGasLimit;
  }
};
