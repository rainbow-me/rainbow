import { BigNumberish } from '@ethersproject/bignumber';
import { Block, StaticJsonRpcProvider } from '@ethersproject/providers';
import {
  ALLOWS_PERMIT,
  ChainId,
  CrosschainQuote,
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
  getQuoteExecutionDetails,
  getWrappedAssetMethod,
  PermitSupportedTokenList,
  Quote,
  RAINBOW_ROUTER_CONTRACT_ADDRESS,
  WRAPPED_ASSET,
} from '@rainbow-me/swaps';
import { Contract } from '@ethersproject/contracts';
import { MaxUint256 } from '@ethersproject/constants';
import { mapKeys, mapValues } from 'lodash';
import { IS_TESTING } from 'react-native-dotenv';
import { Token } from '../entities/tokens';
import {
  estimateGasWithPadding,
  getProviderForNetwork,
  toHexNoLeadingZeros,
} from './web3';
import config from '@/model/config';
import { Asset } from '@/entities';
import {
  add,
  convertRawAmountToDecimalFormat,
  divide,
  lessThan,
  multiply,
  subtract,
} from '@/helpers/utilities';
import { Network } from '@/helpers/networkTypes';
import { erc20ABI, ethUnits, UNISWAP_TESTNET_TOKEN_LIST } from '@/references';
import { ethereumUtils, logger } from '@/utils';

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

const GAS_LIMIT_INCREMENT = 50000;
const EXTRA_GAS_PADDING = 1.5;
const SWAP_GAS_PADDING = 1.1;
const CHAIN_IDS_WITH_TRACE_SUPPORT = [ChainId.mainnet];

export async function getClosestGasEstimate(
  estimationFn: (gasEstimate: number) => Promise<boolean>
) {
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
      guessIndex = Math.max(
        Math.floor((end + start) / 2) - 1,
        highestFailedGuess || 0
      );
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
      (highestFailedGuess !== null &&
        highestFailedGuess + 1 === lowestSuccessfulGuess) ||
      lowestSuccessfulGuess === 0 ||
      (lowestSuccessfulGuess !== null &&
        lowestFailureGuess === lowestSuccessfulGuess - 1)
    ) {
      return gasEstimates[lowestSuccessfulGuess];
    }

    if (highestFailedGuess === gasEstimates.length - 1) {
      return -1;
    }
  }
}

const getCrosschainSwapDefaultGasLimit = (tradeDetails: CrosschainQuote) =>
  tradeDetails?.routes?.[0]?.userTxs?.[0]?.gasFees?.gasLimit;

const getCrosschainSwapRainbowDefaultGasLimit = (chainId: ChainId) =>
  ethereumUtils.getBasicSwapGasLimit(Number(chainId)) * EXTRA_GAS_PADDING;

export const getCrosschainSwapServiceTime = (tradeDetails: CrosschainQuote) =>
  tradeDetails?.routes?.[0]?.serviceTime;

export const getDefaultGasLimitForTrade = (
  tradeDetails: Quote,
  chainId: ChainId
): number => {
  const allowsPermit =
    chainId === ChainId.mainnet &&
    ALLOWS_PERMIT[
      tradeDetails?.sellTokenAddress?.toLowerCase() as keyof PermitSupportedTokenList
    ];

  let defaultGasLimit = tradeDetails?.defaultGasLimit;

  if (allowsPermit) {
    defaultGasLimit = Math.max(
      Number(defaultGasLimit),
      Number(ethUnits.basic_swap_permit) * EXTRA_GAS_PADDING
    ).toString();
  }
  return (
    Number(defaultGasLimit || 0) ||
    ethereumUtils.getBasicSwapGasLimit(Number(chainId)) * EXTRA_GAS_PADDING
  );
};

export const getStateDiff = async (
  provider: StaticJsonRpcProvider,
  tradeDetails: Quote
): Promise<any> => {
  const tokenAddress = tradeDetails.sellTokenAddress;
  const fromAddr = tradeDetails.from;
  const toAddr = RAINBOW_ROUTER_CONTRACT_ADDRESS;
  const tokenContract = new Contract(tokenAddress, erc20ABI, provider);
  const {
    number: blockNumber,
  } = await (provider.getBlock as () => Promise<Block>)();

  // Get data
  const { data } = await tokenContract.populateTransaction.approve(
    toAddr,
    MaxUint256.toHexString()
  );

  // trace_call default params
  const callParams = [
    {
      data,
      from: fromAddr,
      to: tokenAddress,
      value: '0x0',
    },
    ['stateDiff'],
    blockNumber - Number(config.trace_call_block_number_offset || 20),
  ];

  const trace = await provider.send('trace_call', callParams);

  if (trace.stateDiff) {
    const slotAddress = Object.keys(
      trace.stateDiff[tokenAddress]?.storage
    )?.[0];
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
  logger.log('Couldnt get stateDiff...', JSON.stringify(trace, null, 2));
};

export const getSwapGasLimitWithFakeApproval = async (
  chainId: number,
  provider: StaticJsonRpcProvider,
  tradeDetails: Quote
): Promise<number> => {
  let stateDiff: any;

  try {
    stateDiff = await getStateDiff(provider, tradeDetails);
    const { router, methodName, params, methodArgs } = getQuoteExecutionDetails(
      tradeDetails,
      { from: tradeDetails.from },
      provider
    );

    const { data } = await router.populateTransaction[methodName](
      ...(methodArgs ?? []),
      params
    );

    const gasLimit = await getClosestGasEstimate(async (gas: number) => {
      const callParams = [
        {
          data,
          from: tradeDetails.from,
          gas: toHexNoLeadingZeros(gas),
          gasPrice: toHexNoLeadingZeros(`100000000000`),
          to:
            (tradeDetails as CrosschainQuote)?.allowanceTarget ||
            RAINBOW_ROUTER_CONTRACT_ADDRESS,
          value: '0x0', // 100 gwei
        },
        'latest',
      ];

      try {
        await provider.send('eth_call', [...callParams, stateDiff]);
        logger.log(`Estimate worked with gasLimit: `, gas);
        return true;
      } catch (e) {
        logger.log(
          `Estimate failed with gasLimit ${gas}. Trying with different amounts...`
        );
        return false;
      }
    });
    if (gasLimit && gasLimit >= ethUnits.basic_swap) {
      return gasLimit;
    } else {
      logger.log('Could not find a gas estimate');
    }
  } catch (e) {
    logger.log(`Blew up trying to get state diff. Falling back to defaults`, e);
  }
  return getDefaultGasLimitForTrade(tradeDetails, chainId);
};

export const getTestnetUniswapPairs = (
  network: Network
): { [key: string]: Asset } => {
  const pairs: { [address: string]: Asset } =
    (UNISWAP_TESTNET_TOKEN_LIST as any)?.[network] ?? {};

  const loweredPairs = mapKeys(pairs, (_, key) => key.toLowerCase());
  return mapValues(loweredPairs, value => ({
    ...value,
    address: value.address.toLowerCase(),
  }));
};

export const estimateSwapGasLimit = async ({
  chainId,
  requiresApprove,
  tradeDetails,
}: {
  chainId: ChainId;
  requiresApprove?: boolean;
  tradeDetails: Quote | null;
}): Promise<string | number> => {
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const provider = await getProviderForNetwork(network);
  if (!provider || !tradeDetails) {
    return ethereumUtils.getBasicSwapGasLimit(Number(chainId));
  }
  const { sellTokenAddress, buyTokenAddress } = tradeDetails;
  const isWrapNativeAsset =
    sellTokenAddress === ETH_ADDRESS_AGGREGATORS &&
    buyTokenAddress === WRAPPED_ASSET[chainId];
  const isUnwrapNativeAsset =
    sellTokenAddress === WRAPPED_ASSET[chainId] &&
    buyTokenAddress === ETH_ADDRESS_AGGREGATORS;

  // Wrap / Unwrap Eth
  if (isWrapNativeAsset || isUnwrapNativeAsset) {
    const default_estimate = isWrapNativeAsset
      ? ethUnits.weth_wrap
      : ethUnits.weth_unwrap;
    try {
      const gasLimit = await estimateGasWithPadding(
        {
          from: tradeDetails.from,
          value: isWrapNativeAsset ? tradeDetails.buyAmount : '0',
        },
        getWrappedAssetMethod(
          isWrapNativeAsset ? 'deposit' : 'withdraw',
          provider,
          chainId
        ),
        // @ts-ignore
        isUnwrapNativeAsset ? [tradeDetails.buyAmount] : null,
        provider,
        1.002
      );

      return gasLimit || tradeDetails?.defaultGasLimit || default_estimate;
    } catch (e) {
      return tradeDetails?.defaultGasLimit || default_estimate;
    }
    // Swap
  } else {
    try {
      const { params, method, methodArgs } = getQuoteExecutionDetails(
        tradeDetails,
        { from: tradeDetails.from },
        provider
      );

      if (requiresApprove) {
        if (
          CHAIN_IDS_WITH_TRACE_SUPPORT.includes(chainId) &&
          IS_TESTING !== 'true'
        ) {
          try {
            const gasLimitWithFakeApproval = await getSwapGasLimitWithFakeApproval(
              chainId,
              provider,
              tradeDetails
            );
            logger.debug(
              ' ✅ Got gasLimitWithFakeApproval!',
              gasLimitWithFakeApproval
            );
            return gasLimitWithFakeApproval;
          } catch (e) {
            logger.debug('Error estimating swap gas limit with approval', e);
          }
        }

        return getDefaultGasLimitForTrade(tradeDetails, chainId);
      }

      const gasLimit = await estimateGasWithPadding(
        params,
        method,
        methodArgs as any,
        provider,
        SWAP_GAS_PADDING
      );
      return gasLimit || getDefaultGasLimitForTrade(tradeDetails, chainId);
    } catch (error) {
      return getDefaultGasLimitForTrade(tradeDetails, chainId);
    }
  }
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
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const provider = await getProviderForNetwork(network);
  if (!provider || !tradeDetails) {
    return ethereumUtils.getBasicSwapGasLimit(Number(chainId));
  }
  try {
    if (requiresApprove) {
      if (
        CHAIN_IDS_WITH_TRACE_SUPPORT.includes(chainId) &&
        IS_TESTING !== 'true'
      ) {
        try {
          const gasLimitWithFakeApproval = await getSwapGasLimitWithFakeApproval(
            chainId,
            provider,
            tradeDetails
          );
          logger.debug(
            ' ✅ Got gasLimitWithFakeApproval!',
            gasLimitWithFakeApproval
          );
          return gasLimitWithFakeApproval;
        } catch (e) {
          logger.debug('Error estimating swap gas limit with approval', e);
        }
      }

      const routeGasLimit = getCrosschainSwapDefaultGasLimit(tradeDetails);
      const rainbowDefaultGasLimit = getCrosschainSwapRainbowDefaultGasLimit(
        chainId
      );
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
    const rainbowDefaultGasLimit = getCrosschainSwapRainbowDefaultGasLimit(
      chainId
    );

    let fallbackGasLimit: BigNumberish = rainbowDefaultGasLimit;
    if (routeGasLimit && lessThan(rainbowDefaultGasLimit, routeGasLimit)) {
      fallbackGasLimit = routeGasLimit;
    }
    return gasLimit || fallbackGasLimit;
  } catch (error) {
    const routeGasLimit = getCrosschainSwapDefaultGasLimit(tradeDetails);
    const rainbowDefaultGasLimit = getCrosschainSwapRainbowDefaultGasLimit(
      chainId
    );

    let fallbackGasLimit: BigNumberish = rainbowDefaultGasLimit;
    if (routeGasLimit && lessThan(rainbowDefaultGasLimit, routeGasLimit)) {
      fallbackGasLimit = routeGasLimit;
    }
    return fallbackGasLimit;
  }
};

export const computeSlippageAdjustedAmounts = (
  trade: any,
  allowedSlippageInBlips: string
): { [field in Field]: BigNumberish } => {
  let input = trade?.sellAmount;
  let output = trade?.buyAmount;
  if (trade?.tradeType === 'exact_input' && trade?.buyAmount) {
    const product = multiply(trade.buyAmount, allowedSlippageInBlips);
    const result = divide(product, '10000');
    output = convertRawAmountToDecimalFormat(
      subtract(output, result),
      trade.outputTokenDecimals
    );
  } else if (trade?.tradeType === 'exact_output' && trade?.sellAmount) {
    const product = multiply(trade.sellAmount, allowedSlippageInBlips);
    const result = divide(product, '10000');

    input = convertRawAmountToDecimalFormat(
      add(input, result),
      trade.inputTokenDecimals
    );
  }

  const results = {
    [Field.INPUT]: input,
    [Field.OUTPUT]: output,
  };
  return results;
};

export const getTokenForCurrency = (
  currency: Asset,
  chainId: ChainId
): Token => {
  return { ...currency, chainId } as Token;
};
