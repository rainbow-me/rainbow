import {
  CrosschainQuote,
  getTargetAddress,
  isAllowedTargetContract,
  prepareFillCrosschainQuote,
  prepareFillQuote,
  Quote,
  QuoteError,
} from '@rainbow-me/swaps';
import { Address, encodeFunctionData, erc20Abi, WalletClient, PublicClient, createPublicClient, http } from 'viem';
import { RapSwapActionParameters } from '@/raps/references';
import { TransactionGasParamAmounts } from '@/entities/gas';
import { ParsedAsset } from '@/__swaps__/types/assets';
import { assetNeedsUnlocking } from '@/raps/actions/unlock';
import { getProvider } from '@/handlers/web3';
import { loadWallet, loadWalletViem } from '@/model/wallet';
import { Signer } from '@ethersproject/abstract-signer';
import { ATOMIC_SWAPS, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';
import {
  encodeDelegateCalldata,
  executeBatchedTransaction,
  executeDelegation,
  executeRevokeDelegation,
  getCanDelegate,
  getIsDelegated,
} from '@rainbow-me/delegation';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { logger, RainbowError } from '@/logger';
import { metadataPOSTClient } from '@/graphql';
import { add } from '@/helpers/utilities';

export type DelegateExecutionResult = {
  hash: `0x${string}` | null;
  error: string | null;
};

export const walletExecuteWithDelegate = async ({
  walletClient,
  publicClient,
  type,
  parameters,
}: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  type: 'swap' | 'crosschainSwap';
  parameters: Omit<RapSwapActionParameters<typeof type>, 'gasFeeParamsBySpeed' | 'selectedGasFee'>;
}): Promise<DelegateExecutionResult> => {
  try {
    const { quote, chainId } = parameters;

    const targetAddress = getTargetAddress(quote);
    if (!targetAddress) {
      throw new Error('Target address not found');
    }

    const isAllowedTarget = isAllowedTargetContract(targetAddress, chainId as number);
    if (!isAllowedTarget) {
      throw new Error('Target address not allowed');
    }

    // Check if already delegated before the transaction
    const wasAlreadyDelegated = await getIsDelegated({
      address: quote.from as Address,
      chainId,
      publicClient,
    });

    const calls = await getApproveAndSwapCalls(quote);

    // EIP-1559 is required for EIP-7702 delegation
    const gasParams = parameters.gasParams as TransactionGasParamAmounts;

    const tx = await executeBatchedTransaction({
      walletClient,
      publicClient: publicClient,
      calls,
      transactionOptions: {
        maxFeePerGas: BigInt(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(gasParams.maxPriorityFeePerGas),
        gasLimit: BigInt((await estimateDelegatedApproveAndSwapGasLimit(quote)) || '0'),
      },
    });

    return { hash: tx.txHash as `0x${string}`, error: null };
  } catch (error) {
    return { hash: null, error: error instanceof Error ? error.message : String(error) };
  }
};

export const getShouldDelegate = async (chainId: number, quote: Quote | CrosschainQuote | QuoteError, assetToSell?: ParsedAsset | null) => {
  if (!assetToSell || 'error' in quote) return false;
  const canDelegate = getCanDelegate(chainId);
  const needsUnlocking = await assetNeedsUnlocking({
    owner: quote.from as `0x${string}`,
    amount: quote.sellAmount.toString(),
    assetToUnlock: assetToSell,
    spender: quote.from as `0x${string}`,
    chainId: chainId,
  });
  return canDelegate && needsUnlocking;
};

export const useShouldDelegate = (chainId: number, quote: Quote | CrosschainQuote, assetToSell?: ParsedAsset | null) => {
  const atomicSwapsEnabled = useExperimentalFlag(ATOMIC_SWAPS);
  const config = useRemoteConfig();
  const shouldDelegate = (atomicSwapsEnabled || config.atomic_swaps_enabled) && getShouldDelegate(chainId, quote, assetToSell);
  return shouldDelegate;
};

export const getApproveAndSwapCalls = async (quote: Quote | CrosschainQuote) => {
  const provider = getProvider({ chainId: quote.chainId });
  const wallet = await loadWallet({ provider });
  const approvalAmount = BigInt(quote.sellAmount.toString());
  const approvalCalldata = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [quote.allowanceTarget as Address, approvalAmount],
  });

  let swapCalldata;
  if (quote.swapType === 'cross-chain') {
    swapCalldata = await prepareFillCrosschainQuote(quote as CrosschainQuote, 'native-app');
  } else {
    swapCalldata = await prepareFillQuote(quote as Quote, {}, wallet as Signer, false, quote.chainId, 'native-app');
  }

  const tokenAddress = (quote as Quote).sellTokenAddress ?? (quote as CrosschainQuote).sellTokenAddress;

  return [
    {
      to: tokenAddress as Address,
      value: 0n,
      data: approvalCalldata,
    },
    {
      to: swapCalldata?.to as Address,
      value: BigInt(swapCalldata?.value?.toString() || '0'),
      data: swapCalldata?.data as `0x${string}`,
    },
  ];
};

/**
 * Calculate the fixed gas overhead for EIP-7702 delegation transactions.
 * This covers costs not captured when simulating internal calls separately.
 */
const estimateDelegationOverhead = (calldataLength: number): bigint => {
  const BASE_TX = 21_000n;
  const AUTH_COST = 15_800n;
  const EXECUTE_OVERHEAD = 5_000n;
  const AVG_CALLDATA_COST_PER_BYTE = 14n;
  const BUFFER_BPS = 2000n;

  const calldataCost = BigInt(calldataLength) * AVG_CALLDATA_COST_PER_BYTE;
  const overhead = BASE_TX + AUTH_COST + EXECUTE_OVERHEAD + calldataCost;

  logger.debug('[delegateActions] estimateDelegationOverhead', {
    calldataCost: calldataCost.toString(),
    overhead: overhead.toString(),
    buffer: ((overhead * BUFFER_BPS) / 10000n).toString(),
    total: (overhead + (overhead * BUFFER_BPS) / 10000n).toString(),
  });

  return overhead + (overhead * BUFFER_BPS) / 10000n;
};

/**
 * Estimate gas for a delegated approve + swap transaction.
 * Simulates internal calls via metadata API and adds fixed delegation overhead.
 */
export const estimateDelegatedApproveAndSwapGasLimit = async (quote: Quote | CrosschainQuote): Promise<string | null> => {
  try {
    const calls = await getApproveAndSwapCalls(quote);
    const delegateCalldata = await encodeDelegateCalldata(calls);

    const simulation = await metadataPOSTClient.simulateTransactions({
      chainId: quote.chainId,
      transactions: [
        { from: quote.from, to: calls[0].to, data: calls[0].data, value: '0x0' },
        { from: quote.from, to: calls[1].to, data: calls[1].data, value: `0x${calls[1].value.toString(16)}` },
      ],
    });

    const gasEstimate = simulation.simulateTransactions
      ?.map(res => res?.gas?.estimate)
      .reduce((acc, limit) => (acc && limit ? add(acc, limit) : acc), '0');

    if (!gasEstimate) {
      return null;
    }

    const total = BigInt(gasEstimate) + estimateDelegationOverhead(delegateCalldata.length);
    logger.debug('[delegateActions] estimated delegation overhead', {
      overhead: estimateDelegationOverhead(delegateCalldata.length).toString(),
    });

    logger.debug('[delegateActions] Gas estimation', {
      gasEstimate,
      total: total.toString(),
    });

    return total.toString();
  } catch (error) {
    logger.error(new RainbowError('[delegateActions] Gas estimation failed'), { error });
    return null;
  }
};

export const walletExecuteDelegate = async ({
  accountAddress,
  chainId,
}: {
  accountAddress: string;
  chainId: ChainId;
}): Promise<{ txHash: `0x${string}` | undefined }> => {
  const networks = useBackendNetworksStore.getState().getDefaultChains();
  const network = networks[chainId];

  if (!network?.rpcUrls?.default?.http?.[0]) {
    throw new Error(`No RPC URL found for chain ${chainId}`);
  }

  const publicClient = createPublicClient({
    chain: network,
    transport: http(network.rpcUrls.default.http[0]),
  });

  const walletClient = await loadWalletViem({
    address: accountAddress,
    publicClient,
  });

  if (!walletClient) {
    throw new Error('Failed to load wallet client');
  }

  const feeData = await publicClient.estimateFeesPerGas();
  const gasLimit = 100000n;

  const tx = await executeDelegation({
    walletClient,
    publicClient,
    calldata: '0x',
    transactionOptions: {
      maxFeePerGas: feeData.maxFeePerGas ?? 0n,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? 0n,
      gasLimit,
    },
  });

  return { txHash: tx.txHash as `0x${string}` | undefined };
};

export const walletExecuteRevoke = async ({
  accountAddress,
  chainId,
}: {
  accountAddress: string;
  chainId: ChainId;
}): Promise<{ txHash: `0x${string}` | undefined }> => {
  const networks = useBackendNetworksStore.getState().getDefaultChains();
  const network = networks[chainId];

  if (!network?.rpcUrls?.default?.http?.[0]) {
    throw new Error(`No RPC URL found for chain ${chainId}`);
  }

  const publicClient = createPublicClient({
    chain: network,
    transport: http(network.rpcUrls.default.http[0]),
  });

  const walletClient = await loadWalletViem({
    address: accountAddress,
    publicClient,
  });

  if (!walletClient) {
    throw new Error('Failed to load wallet client');
  }

  const feeData = await publicClient.estimateFeesPerGas();

  const result = await executeRevokeDelegation({
    walletClient,
    publicClient,
    transactionOptions: {
      maxFeePerGas: feeData.maxFeePerGas ?? 0n,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? 0n,
      gasLimit: null,
    },
  });

  return { txHash: result.txHash as `0x${string}` | undefined };
};
