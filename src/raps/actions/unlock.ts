import { type Signer } from '@ethersproject/abstract-signer';
import { MaxUint256 } from '@ethersproject/constants';
import { Contract, type PopulatedTransaction } from '@ethersproject/contracts';
import { parseUnits } from '@ethersproject/units';
import { supportsDelegation, type BatchCall } from '@rainbow-me/delegation';
import { getProvider, toHex } from '@/handlers/web3';
import { type Address, erc20Abi, erc721Abi } from 'viem';
import { type ChainId } from '@/state/backendNetworks/types';
import { type TransactionGasParams, type TransactionLegacyGasParams } from '@/__swaps__/types/gas';
import { type NewTransaction, TransactionStatus } from '@/entities/transactions';
import { addNewTransaction } from '@/state/pendingTransactions';
import { RainbowError, ensureError, logger } from '@/logger';
import { ETH_ADDRESS, gasUnits } from '@/references';
import { type ActionProps, type PrepareActionProps, type RapActionResult, type RapUnlockActionParameters } from '../references';
import { overrideWithFastSpeedIfNeeded } from './../utils';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getRemoteConfig } from '@/model/remoteConfig';
import { DELEGATION, getExperimentalFlag } from '@/config/experimental';
import { requireAddress, requireHex } from '../validation';

/**
 * Determines the approval amount based on delegation support.
 * If the address supports delegation (EIP-7702), use finite approvals for better security.
 * Otherwise, use unlimited approvals (MaxUint256) for better UX.
 */
const getApprovalAmount = async ({
  address,
  chainId,
  amount,
}: {
  address: Address;
  chainId: ChainId;
  amount: string;
}): Promise<{ approvalAmount: string; isUnlimited: boolean }> => {
  const delegationEnabled = getRemoteConfig().delegation_enabled || getExperimentalFlag(DELEGATION);
  const { supported: delegationSupported } = await supportsDelegation({ address, chainId });
  if (delegationEnabled && delegationSupported) {
    return { approvalAmount: amount, isUnlimited: false };
  }
  return { approvalAmount: MaxUint256.toString(), isUnlimited: true };
};

export const getAssetRawAllowance = async ({
  owner,
  assetAddress,
  spender,
  chainId,
}: {
  owner: Address;
  assetAddress: Address;
  spender: Address;
  chainId: ChainId;
}) => {
  try {
    const provider = getProvider({ chainId });
    const tokenContract = new Contract(assetAddress, erc20Abi, provider);
    const allowance = await tokenContract.allowance(owner, spender);
    return allowance.toString();
  } catch (error) {
    logger.error(new RainbowError('[raps/unlock]: error'), {
      message: ensureError(error).message,
    });
    return null;
  }
};

function parseRawAmount(value: string): bigint | null {
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

export async function needsTokenApproval({
  owner,
  tokenAddress,
  spender,
  amount,
  chainId,
}: {
  owner: Address;
  tokenAddress: Address;
  spender: Address;
  amount: string;
  chainId: ChainId;
}): Promise<boolean> {
  const requiredAmount = parseRawAmount(amount);
  if (requiredAmount === null) return true;

  const allowance = await getAssetRawAllowance({
    owner,
    assetAddress: tokenAddress,
    spender,
    chainId,
  });
  if (allowance === null) return true;

  const currentAllowance = parseRawAmount(allowance);
  if (currentAllowance === null) return true;

  return currentAllowance < requiredAmount;
}

export const estimateApprove = async ({
  owner,
  tokenAddress,
  spender,
  chainId,
}: {
  owner: Address;
  tokenAddress: Address;
  spender: Address;
  chainId: ChainId;
}): Promise<string> => {
  try {
    const provider = getProvider({ chainId });
    const tokenContract = new Contract(tokenAddress, erc20Abi, provider);
    const gasLimit = await tokenContract.estimateGas.approve(spender, MaxUint256, {
      from: owner,
    });

    if (gasLimit === null || gasLimit === undefined || isNaN(Number(gasLimit.toString()))) {
      return `${gasUnits.basic_approval}`;
    }

    return gasLimit.toString();
  } catch (error) {
    logger.error(new RainbowError('[raps/unlock]: error estimateApprove'), {
      message: ensureError(error).message,
    });
    return `${gasUnits.basic_approval}`;
  }
};

export const populateApprove = async ({
  owner,
  tokenAddress,
  spender,
  chainId,
  amount,
}: {
  owner: Address;
  tokenAddress: Address;
  spender: Address;
  chainId: ChainId;
  amount: string;
}): Promise<PopulatedTransaction | null> => {
  try {
    const { approvalAmount } = await getApprovalAmount({ address: owner, chainId, amount });
    const provider = getProvider({ chainId });
    const tokenContract = new Contract(tokenAddress, erc20Abi, provider);
    const approveTransaction = await tokenContract.populateTransaction.approve(spender, approvalAmount, {
      from: owner,
    });
    return approveTransaction;
  } catch (error) {
    logger.error(new RainbowError('[raps/unlock]: error populateApprove'), {
      message: ensureError(error).message,
    });
    return null;
  }
};

export const prepareUnlock = async ({ parameters }: PrepareActionProps<'unlock'>): Promise<{ call: BatchCall | null }> => {
  const tokenAddress = requireAddress(parameters.assetToUnlock.address, 'unlock asset address');
  const tx = await populateApprove({
    owner: parameters.fromAddress,
    tokenAddress,
    spender: parameters.contractAddress,
    chainId: parameters.chainId,
    amount: parameters.amount,
  });
  if (!tx?.data) return { call: null };
  return {
    call: {
      to: tokenAddress,
      value: toHex(tx?.value ?? 0),
      data: requireHex(tx.data, 'unlock prepared tx.data'),
    },
  };
};

type UnlockTransactionParams = RapUnlockActionParameters & {
  data: string;
  value?: string;
  approvalAmount?: 'UNLIMITED' | string;
};

function buildUnlockTransaction(
  parameters: UnlockTransactionParams,
  gasParams: TransactionGasParams | TransactionLegacyGasParams,
  nonce?: number,
  gasLimit?: string
): Omit<NewTransaction, 'hash'> {
  const chainsName = useBackendNetworksStore.getState().getChainsName();
  const { assetToUnlock, chainId, data, value } = parameters;

  return {
    asset: {
      ...assetToUnlock,
      network: chainsName[assetToUnlock.chainId],
      colors: assetToUnlock.colors,
    },
    data,
    value,
    changes: [],
    from: parameters.fromAddress,
    to: assetToUnlock.address,
    gasLimit,
    network: chainsName[chainId],
    chainId,
    nonce,
    status: TransactionStatus.pending,
    type: 'approve',
    approvalAmount: parameters.approvalAmount ?? parameters.amount,
    ...gasParams,
  } as Omit<NewTransaction, 'hash'>;
}

export const estimateERC721Approval = async ({
  owner,
  tokenAddress,
  spender,
  chainId,
}: {
  owner: Address;
  tokenAddress: Address;
  spender: Address;
  chainId: ChainId;
}): Promise<string> => {
  try {
    const provider = getProvider({ chainId });
    const tokenContract = new Contract(tokenAddress, erc721Abi, provider);
    const gasLimit = await tokenContract.estimateGas.setApprovalForAll(spender, false, {
      from: owner,
    });
    return gasLimit ? gasLimit.toString() : `${gasUnits.basic_approval}`;
  } catch (error) {
    logger.error(new RainbowError('[raps/unlock]: error estimateApproval'), {
      message: ensureError(error).message,
    });
    return `${gasUnits.basic_approval}`;
  }
};

export const populateRevokeApproval = async ({
  tokenAddress,
  spenderAddress,
  chainId,
  type = 'erc20',
}: {
  tokenAddress?: Address;
  spenderAddress?: Address;
  chainId?: ChainId;
  type: 'erc20' | 'nft';
}): Promise<PopulatedTransaction> => {
  if (!tokenAddress || !spenderAddress || !chainId) return {};
  const provider = getProvider({ chainId });
  const tokenContract = new Contract(tokenAddress, erc721Abi, provider);
  if (type === 'erc20') {
    const amountToApprove = parseUnits('0', 'ether');
    const txObject = await tokenContract.populateTransaction.approve(spenderAddress, amountToApprove);
    return txObject;
  } else {
    const txObject = await tokenContract.populateTransaction.setApprovalForAll(spenderAddress, false);
    return txObject;
  }
};

export const executeApprove = async ({
  gasLimit,
  gasParams,
  nonce,
  spender,
  tokenAddress,
  wallet,
  amount,
}: {
  chainId: ChainId;
  gasLimit: string;
  gasParams: Partial<TransactionGasParams & TransactionLegacyGasParams>;
  nonce?: number;
  spender: Address;
  tokenAddress: Address;
  wallet: Signer;
  amount: string;
}) => {
  const exchange = new Contract(tokenAddress, erc20Abi, wallet);
  return exchange.approve(spender, amount, {
    gasLimit: toHex(gasLimit) || undefined,
    // In case it's an L2 with legacy gas price like arbitrum
    gasPrice: gasParams.gasPrice,
    // EIP-1559 like networks
    maxFeePerGas: gasParams.maxFeePerGas,
    maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
    nonce: nonce !== undefined ? toHex(nonce) : undefined,
  });
};

export const unlock = async ({
  baseNonce,
  index,
  parameters,
  wallet,
  gasParams,
  gasFeeParamsBySpeed,
}: ActionProps<'unlock'>): Promise<RapActionResult> => {
  const { assetToUnlock, contractAddress, chainId } = parameters;

  let gasParamsToUse = gasParams;

  const { address: assetAddress } = assetToUnlock;

  if (assetAddress === ETH_ADDRESS) throw new RainbowError('unlock: Native ETH cannot be unlocked');

  let gasLimit;
  try {
    gasLimit = await estimateApprove({
      owner: parameters.fromAddress,
      tokenAddress: assetAddress,
      spender: contractAddress,
      chainId,
    });
  } catch (e) {
    logger.error(new RainbowError('[raps/unlock]: error estimateApprove'), {
      message: ensureError(e).message,
    });
    throw e;
  }

  gasParamsToUse = overrideWithFastSpeedIfNeeded({
    gasParams,
    chainId,
    gasFeeParamsBySpeed,
  });

  const nonce = typeof baseNonce === 'number' ? baseNonce + index : undefined;

  const { approvalAmount, isUnlimited } = await getApprovalAmount({
    address: parameters.fromAddress,
    chainId,
    amount: parameters.amount,
  });

  let approval;
  try {
    approval = await executeApprove({
      tokenAddress: assetAddress,
      spender: contractAddress,
      gasLimit,
      gasParams: gasParamsToUse,
      wallet,
      nonce,
      chainId,
      amount: approvalAmount,
    });
  } catch (e) {
    logger.error(new RainbowError('[raps/unlock]: error executeApprove'), {
      message: ensureError(e).message,
    });
    throw e;
  }

  if (!approval) throw new RainbowError('[raps/unlock]: error executeApprove');

  const transaction: NewTransaction = {
    ...buildUnlockTransaction(
      {
        ...parameters,
        data: approval.data,
        value: approval.value?.toString() || '0',
        approvalAmount: isUnlimited ? 'UNLIMITED' : approvalAmount,
      },
      gasParamsToUse,
      approval.nonce,
      gasLimit
    ),
    hash: approval.hash,
  };

  addNewTransaction({
    address: parameters.fromAddress,
    chainId: approval.chainId,
    transaction,
  });

  return {
    nonce: approval?.nonce,
    hash: approval?.hash,
  };
};
