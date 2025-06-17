import {
  CrosschainQuote,
  getTargetAddress,
  isAllowedTargetContract,
  prepareFillCrosschainQuote,
  prepareFillQuote,
  Quote,
  QuoteError,
} from '@rainbow-me/swaps';
import { encodeFunctionData, Address, erc20Abi, WalletClient, PublicClient, Chain, parseAbi, Authorization } from 'viem';
import { RapSwapActionParameters } from '@/raps/references';
import { mainnet, polygon, base, optimism, bsc, sepolia } from '@wagmi/chains';
import { TransactionGasParamAmounts } from '@/entities/gas';
import { metadataPOSTClient } from '@/graphql';
import { assetNeedsUnlocking } from '@/raps/actions/unlock';
import { ParsedAsset } from '@/__swaps__/types/assets';
import { getProvider } from '@/handlers/web3';
import { loadWallet } from '@/model/wallet';
import { Signer } from '@ethersproject/abstract-signer';
import { ATOMIC_SWAPS, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';

const MAX_UINT = 2n ** 256n - 1n;

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
}): Promise<{ hash: `0x${string}` | null; error: string | null }> => {
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

    const calls = await getApproveAndSwapCalls(quote);

    // EIP-1559 is required for EIP-7702 delegation
    const gasParams = parameters.gasParams as TransactionGasParamAmounts;

    const tx = await executeBatchedTransaction({
      walletClient,
      publicClient: publicClient,
      calls,
      transactionOptions: {
        maxFeePerGas: gasParams.maxFeePerGas,
        maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
        gasLimit: BigInt((await estimateDelegatedApproveAndSwapGasLimit(quote)) || '0'),
      },
    });

    return { hash: tx.txHash as `0x${string}`, error: null };
  } catch (error) {
    return { hash: null, error: error instanceof Error ? error.message : String(error) };
  }
};

// Create a lookup map for chain ID to chain object
const CHAIN_LOOKUP: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [polygon.id]: polygon,
  [base.id]: base,
  [optimism.id]: optimism,
  [bsc.id]: bsc,
  [sepolia.id]: sepolia,
};

// Constants for delegation addresses across different chains
export const DELEGATION_ADDRESSES: Record<number, string> = {
  [mainnet.id]: '0x000000009B1D0aF20D8C6d0A44e162d11F9b8f00',
  [polygon.id]: '0x000000009B1D0aF20D8C6d0A44e162d11F9b8f00',
  [base.id]: '0x000000009B1D0aF20D8C6d0A44e162d11F9b8f00',
  [optimism.id]: '0x000000009B1D0aF20D8C6d0A44e162d11F9b8f00',
  [bsc.id]: '0x000000009B1D0aF20D8C6d0A44e162d11F9b8f00',
  [sepolia.id]: '0x000000009B1D0aF20D8C6d0A44e162d11F9b8f00',
  [11155420]: '0x000000009B1D0aF20D8C6d0A44e162d11F9b8f00',
};

// Helper to get all supported chain IDs
export const getSupportedChainIds = (): number[] => {
  return Object.keys(DELEGATION_ADDRESSES).map(Number);
};

// Helper to get chain info by ID
export const getChainInfo = (chainId: number): Chain | null => {
  return CHAIN_LOOKUP[chainId] || null;
};

// Helper to get chain name by ID
export const getChainName = (chainId: number): string => {
  const chain = getChainInfo(chainId);
  return chain?.name || `Chain ${chainId}`;
};

// Minimal delegation ABI for executing batched calls
export const minimalDelegationExecAbi = parseAbi([
  'function execute(((address to,uint256 value,bytes data)[] calls,bool revertOnFailure) batched) returns(bytes[])',
]);

// Types
export interface BatchCall {
  to: Address;
  value: bigint;
  data: `0x${string}`;
}

export interface BatchExecutionResult {
  txHash?: `0x${string}`;
  txHashes?: `0x${string}`[];
}

export interface ExecuteBatchedTransactionParams {
  calls: BatchCall[];
  walletClient: WalletClient;
  publicClient: PublicClient;
  revertOnFailure?: boolean;
  transactionOptions: TransactionGasParamAmounts & { gasLimit: bigint | null };
}

export const getIsDelegated = async ({
  address,
  chainId,
  publicClient,
}: {
  address: Address;
  chainId: number;
  publicClient: PublicClient;
}): Promise<boolean> => {
  const code = await publicClient.getCode({ address: address });
  const delegationAddress = DELEGATION_ADDRESSES[chainId];
  if (!delegationAddress) return false;

  const indicator = `0xef0100${delegationAddress.slice(2).toLowerCase()}`;
  return code?.toLowerCase() === indicator;
};

/**
 * Execute batched transactions with optional EIP-7702 delegation
 *
 * @param params - Configuration object containing calls, clients, and options
 * @returns Transaction result with delegation status information
 */
export const executeBatchedTransaction = async ({
  calls,
  walletClient,
  publicClient,
  transactionOptions,
}: ExecuteBatchedTransactionParams): Promise<BatchExecutionResult> => {
  if (!walletClient.account) {
    throw new Error('Wallet client must have an account');
  }

  if (!calls || calls.length === 0) {
    throw new Error('At least one call must be provided');
  }

  const userAddress = walletClient.account.address;
  const chainId = await publicClient.getChainId();
  const chainName = getChainName(chainId);
  const chain = walletClient.chain;
  const delegationAddress = DELEGATION_ADDRESSES[chainId] as Address;
  const delegateCalldata = await encodeDelegateCalldata(calls);

  let auth: Authorization | undefined;

  try {
    auth = await walletClient.signAuthorization({
      account: walletClient.account,
      contractAddress: delegationAddress,
      executor: 'self',
    });
  } catch (error) {
    throw new Error(`Failed to sign authorization for ${chainName} (chain ${chainId}): ${error}`);
  }

  try {
    let gasLimit = transactionOptions.gasLimit;
    if (!gasLimit) {
      gasLimit = await publicClient.estimateGas({
        account: walletClient.account,
        to: userAddress,
        data: delegateCalldata,
        authorizationList: [auth],
      });
    }

    // Send the transaction
    const txHash = await walletClient.sendTransaction({
      account: walletClient.account,
      chain,
      to: userAddress,
      data: delegateCalldata,
      gas: gasLimit,
      maxFeePerGas: BigInt(transactionOptions.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(transactionOptions.maxPriorityFeePerGas),
      accessList: [],
      ...(auth ? { authorizationList: [auth] } : {}),
    });

    return {
      txHash,
    };
  } catch (error) {
    throw new Error(`Failed to execute batched transaction on ${chainName} (chain ${chainId}): ${error}`);
  }
};

export const getCanDelegate = (chainId: number): boolean => {
  // Validate input is a valid number
  if (typeof chainId !== 'number' || isNaN(chainId) || !Number.isInteger(chainId)) {
    return false;
  }

  return DELEGATION_ADDRESSES[chainId] !== undefined;
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
  const approvalCalldata = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [quote.allowanceTarget as Address, MAX_UINT],
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

export const encodeDelegateCalldata = async (calls: BatchCall[]) => {
  const delegateCalldata = encodeFunctionData({
    abi: minimalDelegationExecAbi,
    functionName: 'execute',
    args: [{ calls, revertOnFailure: true }],
  });
  return delegateCalldata;
};

export const simulateDelegatedTransaction = async (quote: Quote | CrosschainQuote) => {
  const delegateCalldata = await encodeDelegateCalldata(await getApproveAndSwapCalls(quote));
  const simulationResult = await metadataPOSTClient.simulateTransactions({
    chainId: quote.chainId,
    transactions: [{ to: quote.from as Address, data: delegateCalldata, from: quote.from as Address, value: '0x0' }],
  });
  return simulationResult;
};

export const estimateDelegatedApproveAndSwapGasLimit = async (quote: Quote | CrosschainQuote) => {
  const simulationResult = await simulateDelegatedTransaction(quote);
  const simulatedEstimate = simulationResult.simulateTransactions?.[0]?.gas?.estimate;
  if (simulatedEstimate) {
    return simulatedEstimate;
  }
  return null;
};
