import { Block, Provider } from '@ethersproject/abstract-provider';
import { MaxUint256 } from '@ethersproject/constants';
import { Contract, PopulatedTransaction } from '@ethersproject/contracts';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { ALLOWS_PERMIT, CrosschainQuote, Quote, getQuoteExecutionDetails, getRainbowRouterContractAddress } from '@rainbow-me/swaps';
import { mainnet } from 'viem/chains';
import { Chain, erc20Abi } from 'viem';
import { Network } from '@/helpers';
import { GasFeeParamsBySpeed, LegacyGasFeeParamsBySpeed, LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { ethereumUtils, gasUtils } from '@/utils';
import { add, greaterThan, multiply } from '@/helpers/utilities';
import { ChainId } from '@/__swaps__/types/chains';
import { gasUnits } from '@/references';
import { toHexNoLeadingZeros } from '@/handlers/web3';

export const CHAIN_IDS_WITH_TRACE_SUPPORT: ChainId[] = [mainnet.id];
export const SWAP_GAS_PADDING = 1.1;

const GAS_LIMIT_INCREMENT = 50000;
const EXTRA_GAS_PADDING = 1.5;
const TRACE_CALL_BLOCK_NUMBER_OFFSET = 20;

export const overrideWithFastSpeedIfNeeded = ({
  gasParams,
  chainId,
  gasFeeParamsBySpeed,
}: {
  gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;
  chainId: number;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
}): TransactionGasParamAmounts | LegacyTransactionGasParamAmounts => {
  if (chainId !== ethereumUtils.getChainIdFromNetwork(Network.mainnet)) {
    return gasParams;
  }
  const transactionGasParams = gasParams as TransactionGasParamAmounts;
  const txnGasFeeParamsBySpeed = gasFeeParamsBySpeed as GasFeeParamsBySpeed;

  const fastMaxPriorityFeePerGas = txnGasFeeParamsBySpeed?.[gasUtils.FAST]?.maxPriorityFeePerGas?.amount;

  const fastMaxFeePerGas = add(txnGasFeeParamsBySpeed?.[gasUtils.FAST]?.maxBaseFee?.amount, fastMaxPriorityFeePerGas);

  if (greaterThan(fastMaxFeePerGas, transactionGasParams?.maxFeePerGas || 0)) {
    transactionGasParams.maxFeePerGas = fastMaxFeePerGas;
  }

  if (greaterThan(fastMaxPriorityFeePerGas, transactionGasParams?.maxPriorityFeePerGas || 0)) {
    transactionGasParams.maxPriorityFeePerGas = fastMaxPriorityFeePerGas;
  }

  return transactionGasParams;
};

const getStateDiff = async (provider: Provider, quote: Quote | CrosschainQuote): Promise<unknown> => {
  const tokenAddress = quote.sellTokenAddress;
  const fromAddr = quote.from;
  const { chainId } = await provider.getNetwork();
  const toAddr = quote.swapType === 'normal' ? getRainbowRouterContractAddress(chainId) : (quote as CrosschainQuote).allowanceTarget;
  const tokenContract = new Contract(tokenAddress, erc20Abi, provider);

  const { number: blockNumber } = await (provider.getBlock as () => Promise<Block>)();

  // Get data
  const { data } = await tokenContract.populateTransaction.approve(toAddr, MaxUint256.toHexString());

  // trace_call default params
  const callParams = [
    {
      data,
      from: fromAddr,
      to: tokenAddress,
      value: '0x0',
    },
    ['stateDiff'],
    blockNumber - TRACE_CALL_BLOCK_NUMBER_OFFSET,
  ];

  const trace = await (provider as StaticJsonRpcProvider).send('trace_call', callParams);

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
};

const getClosestGasEstimate = async (estimationFn: (gasEstimate: number) => Promise<boolean>): Promise<string> => {
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
    // eslint-disable-next-line no-await-in-loop
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
      return String(gasEstimates[lowestSuccessfulGuess]);
    }

    if (highestFailedGuess === gasEstimates.length - 1) {
      return '-1';
    }
  }
  return '-1';
};

export const getDefaultGasLimitForTrade = (quote: Quote, chainId: Chain['id']): string => {
  const allowsPermit = chainId === mainnet.id && ALLOWS_PERMIT[quote?.sellTokenAddress?.toLowerCase()];

  let defaultGasLimit = quote?.defaultGasLimit;

  if (allowsPermit) {
    defaultGasLimit = Math.max(Number(defaultGasLimit), Number(multiply(gasUnits.basic_swap_permit, EXTRA_GAS_PADDING))).toString();
  }
  return defaultGasLimit || multiply(gasUnits.basic_swap[chainId], EXTRA_GAS_PADDING);
};

export const estimateSwapGasLimitWithFakeApproval = async (
  chainId: number,
  provider: Provider,
  quote: Quote | CrosschainQuote
): Promise<string> => {
  let stateDiff: unknown;

  try {
    stateDiff = await getStateDiff(provider, quote);
    const { router, methodName, params, methodArgs } = getQuoteExecutionDetails(
      quote,
      { from: quote.from },
      provider as StaticJsonRpcProvider
    );

    const { data } = await router.populateTransaction[methodName](...(methodArgs ?? []), params);

    const gasLimit = await getClosestGasEstimate(async (gas: number) => {
      const callParams = [
        {
          data,
          from: quote.from,
          gas: toHexNoLeadingZeros(String(gas)),
          gasPrice: toHexNoLeadingZeros(`100000000000`),
          to: quote.swapType === 'normal' ? getRainbowRouterContractAddress : (quote as CrosschainQuote).allowanceTarget,
          value: '0x0', // 100 gwei
        },
        'latest',
      ];

      try {
        await (provider as StaticJsonRpcProvider).send('eth_call', [...callParams, stateDiff]);
        return true;
      } catch (e) {
        return false;
      }
    });
    if (gasLimit && greaterThan(gasLimit, gasUnits.basic_swap[ChainId.mainnet])) {
      return gasLimit;
    }
  } catch (e) {
    //
  }
  return getDefaultGasLimitForTrade(quote, chainId);
};

export const populateSwap = async ({
  provider,
  quote,
}: {
  provider: Provider;
  quote: Quote | CrosschainQuote;
}): Promise<PopulatedTransaction | null> => {
  try {
    const { router, methodName, params, methodArgs } = getQuoteExecutionDetails(
      quote,
      { from: quote.from },
      provider as StaticJsonRpcProvider
    );
    const swapTransaction = await router.populateTransaction[methodName](...(methodArgs ?? []), params);
    return swapTransaction;
  } catch (e) {
    return null;
  }
};
