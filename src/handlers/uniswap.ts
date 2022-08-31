import { BigNumberish } from '@ethersproject/bignumber';
import { Block, StaticJsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import {
  ALLOWS_PERMIT,
  ChainId,
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
  fillQuote,
  getQuoteExecutionDetails,
  getWrappedAssetMethod,
  PermitSupportedTokenList,
  Quote,
  RAINBOW_ROUTER_CONTRACT_ADDRESS,
  unwrapNativeAsset,
  wrapNativeAsset,
  WRAPPED_ASSET,
} from '@rainbow-me/swaps';
import { ethers } from 'ethers';
import { mapKeys, mapValues } from 'lodash';
import {
  // @ts-ignore
  IS_TESTING,
} from 'react-native-dotenv';
import { Token } from '../entities/tokens';
import { loadWallet } from '../model/wallet';
import {
  estimateGasWithPadding,
  getFlashbotsProvider,
  getProviderForNetwork,
  toHex,
  toHexNoLeadingZeros,
} from './web3';
import config from '@/model/config';
import { Asset } from '@/entities';
import {
  add,
  convertRawAmountToDecimalFormat,
  divide,
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

async function getClosestGasEstimate(
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
  //guess is typically middle of array
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
  const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
  const {
    number: blockNumber,
  } = await (provider.getBlock as () => Promise<Block>)();

  // Get data
  const { data } = await tokenContract.populateTransaction.approve(
    toAddr,
    ethers.constants.MaxUint256.toHexString()
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
            [slotAddress]: ethers.constants.MaxUint256.toHexString(),
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
          to: RAINBOW_ROUTER_CONTRACT_ADDRESS,
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

export const executeSwap = async ({
  chainId,
  gasLimit,
  maxFeePerGas,
  maxPriorityFeePerGas,
  gasPrice,
  nonce,
  tradeDetails,
  wallet,
  permit = false,
  flashbots = false,
}: {
  chainId: ChainId;
  gasLimit: string | number;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  gasPrice: string;
  nonce?: number;
  tradeDetails: Quote | null;
  wallet: Wallet | null;
  permit: boolean;
  flashbots: boolean;
}) => {
  let walletToUse = wallet;
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  let provider;

  // Switch to the flashbots provider if enabled
  if (flashbots && network === Network.mainnet) {
    logger.debug('flashbots provider being set on mainnet');
    provider = await getFlashbotsProvider();
  } else {
    logger.debug('normal provider being set', network);
    provider = await getProviderForNetwork(network);
  }

  if (!walletToUse) {
    walletToUse = await loadWallet(undefined, true, provider);
  } else {
    walletToUse = new Wallet(walletToUse.privateKey, provider);
  }

  if (!walletToUse || !tradeDetails) return null;

  const { sellTokenAddress, buyTokenAddress } = tradeDetails;
  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    // In case it's an L2 with legacy gas price like arbitrum
    gasPrice: gasPrice || undefined,
    // EIP-1559 like networks
    maxFeePerGas: maxFeePerGas || undefined,
    maxPriorityFeePerGas: maxPriorityFeePerGas || undefined,
    nonce: nonce ? toHex(nonce) : undefined,
  };

  // Wrap Eth
  if (
    sellTokenAddress === ETH_ADDRESS_AGGREGATORS &&
    buyTokenAddress === WRAPPED_ASSET[chainId]
  ) {
    logger.debug(
      'wrapping native asset',
      tradeDetails.buyAmount,
      walletToUse.address,
      chainId
    );
    return wrapNativeAsset(
      tradeDetails.buyAmount,
      walletToUse,
      chainId,
      transactionParams
    );
    // Unwrap Weth
  } else if (
    sellTokenAddress === WRAPPED_ASSET[chainId] &&
    buyTokenAddress === ETH_ADDRESS_AGGREGATORS
  ) {
    logger.debug(
      'unwrapping native asset',
      tradeDetails.sellAmount,
      walletToUse.address,
      chainId
    );
    return unwrapNativeAsset(
      tradeDetails.sellAmount,
      walletToUse,
      chainId,
      transactionParams
    );
    // Swap
  } else {
    logger.debug(
      'FILLQUOTE',
      tradeDetails,
      transactionParams,
      walletToUse.address,
      permit,
      chainId
    );
    return fillQuote(
      tradeDetails,
      transactionParams,
      walletToUse,
      permit,
      chainId
    );
  }
};

export const getTokenForCurrency = (
  currency: Asset,
  chainId: ChainId
): Token => {
  return { ...currency, chainId } as Token;
};
