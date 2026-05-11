import { type Signer } from '@ethersproject/abstract-signer';
import { MaxUint256 } from '@ethersproject/constants';
import { Contract, type PopulatedTransaction } from '@ethersproject/contracts';
import { parseUnits } from '@ethersproject/units';
import { erc20Abi, erc721Abi, type Address } from 'viem';

import { TransactionStatus, type NewTransaction } from '@/entities/transactions';
import { type TransactionGasParams, type TransactionLegacyGasParams } from '@/features/gas/types/gasSpeed';
import { gasUnits } from '@/features/gas/utils/gasUnits';
import { getProvider, toHex } from '@/handlers/web3';
import { ensureError, logger, RainbowError } from '@/logger';
import { ETH_ADDRESS } from '@/references/constants';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { addNewTransaction } from '@/state/pendingTransactions';
import { type Call } from '@rainbow-me/delegation';

import { type ActionProps, type PrepareActionProps, type RapActionResult, type RapUnlockActionParameters } from '../references';
import { toTransactionAsset } from '../transactionAsset';
import { requireAddress, requireHex } from '../validation';
import { overrideWithFastSpeedIfNeeded } from './../utils';

const UNLIMITED_APPROVAL_AMOUNT = MaxUint256.toString();

function getApprovalAmount({ amount, useExactApproval }: { amount: string; useExactApproval: boolean }): {
  approvalAmount: string;
  isUnlimited: boolean;
} {
  if (useExactApproval) return { approvalAmount: amount, isUnlimited: false };
  return { approvalAmount: UNLIMITED_APPROVAL_AMOUNT, isUnlimited: true };
}

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
  useExactApproval = false,
}: {
  owner: Address;
  tokenAddress: Address;
  spender: Address;
  chainId: ChainId;
  amount: string;
  useExactApproval?: boolean;
}): Promise<PopulatedTransaction | null> => {
  try {
    const { approvalAmount } = getApprovalAmount({ amount, useExactApproval });
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

export async function prepareApprovalCall({
  amount,
  chainId,
  owner,
  spender,
  tokenAddress,
  useExactApproval = false,
}: {
  amount: string;
  chainId: ChainId;
  owner: Address;
  spender: Address;
  tokenAddress: Address;
  useExactApproval?: boolean;
}): Promise<Call | null> {
  const tx = await populateApprove({
    owner,
    tokenAddress,
    spender,
    chainId,
    amount,
    useExactApproval,
  });

  if (!tx?.data) return null;
  return {
    to: tokenAddress,
    value: BigInt(tx.value?.toString() ?? '0'),
    data: requireHex(tx.data, 'unlock prepared tx.data'),
  };
}

export const prepareUnlock = async ({ parameters }: PrepareActionProps<'unlock'>): Promise<{ call: Call | null }> => {
  const tokenAddress = requireAddress(parameters.assetToUnlock.address, 'unlock asset address');
  return {
    call: await prepareApprovalCall({
      amount: parameters.amount,
      chainId: parameters.chainId,
      owner: parameters.fromAddress,
      spender: parameters.contractAddress,
      tokenAddress,
      useExactApproval: true,
    }),
  };
};

type UnlockTransactionParams = Omit<RapUnlockActionParameters, 'assetToUnlock'> & {
  assetToUnlock: RapUnlockActionParameters['assetToUnlock'] & { address: Address };
  data: string;
  value?: string;
  approvalAmount?: 'UNLIMITED' | string;
};

function buildUnlockTransaction(
  parameters: UnlockTransactionParams,
  gasParams: TransactionGasParams | TransactionLegacyGasParams,
  nonce: number,
  gasLimit?: string
): Omit<NewTransaction, 'hash'> {
  const { assetToUnlock, chainId, data, value } = parameters;
  const chainsName = useBackendNetworksStore.getState().getChainsName();
  const asset = toTransactionAsset({
    asset: assetToUnlock,
    chainName: chainsName[assetToUnlock.chainId],
  });

  return {
    asset,
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
  };
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

  const { approvalAmount, isUnlimited } = getApprovalAmount({ amount: parameters.amount, useExactApproval: false });

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
        assetToUnlock: { ...parameters.assetToUnlock, address: assetAddress },
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
