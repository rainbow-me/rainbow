import { Signer } from '@ethersproject/abstract-signer';
import { MaxUint256 } from '@ethersproject/constants';
import { Contract, PopulatedTransaction } from '@ethersproject/contracts';
import { parseUnits } from '@ethersproject/units';
import { getProvider, toHex } from '@/handlers/web3';
import { Address, erc20Abi, erc721Abi } from 'viem';
import { supportsDelegation } from '@rainbow-me/delegation';

import { ChainId } from '@/state/backendNetworks/types';
import { TransactionGasParams, TransactionLegacyGasParams } from '@/__swaps__/types/gas';
import { NewTransaction, TransactionStatus, TxHash } from '@/entities/transactions';
import { addNewTransaction } from '@/state/pendingTransactions';
import { RainbowError, logger } from '@/logger';

import { ETH_ADDRESS, gasUnits } from '@/references';
import { ActionProps, RapActionResult } from '../references';

import { overrideWithFastSpeedIfNeeded } from './../utils';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { ParsedAsset } from '@/resources/assets/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getRemoteConfig } from '@/model/remoteConfig';
import { DELEGATION, getExperimentalFlag } from '@/config/experimental';

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
  if (!delegationEnabled) {
    return { approvalAmount: MaxUint256.toString(), isUnlimited: true };
  }
  const { supported: delegationSupported } = await supportsDelegation({ address, chainId });
  if (delegationSupported) {
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
      message: (error as Error)?.message,
    });
    return null;
  }
};

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
      message: (error as Error)?.message,
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
      message: (error as Error)?.message,
    });
    return null;
  }
};

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
      message: (error as Error)?.message,
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
    nonce: nonce ? toHex(nonce.toString()) : undefined,
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
      message: (e as Error)?.message,
    });
    throw e;
  }

  gasParamsToUse = overrideWithFastSpeedIfNeeded({
    gasParams,
    chainId,
    gasFeeParamsBySpeed,
  });

  const nonce = baseNonce ? baseNonce + index : undefined;

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
      message: (e as Error)?.message,
    });
    throw e;
  }

  if (!approval) throw new RainbowError('[raps/unlock]: error executeApprove');

  const chainsName = useBackendNetworksStore.getState().getChainsName();

  const transaction = {
    asset: {
      ...assetToUnlock,
      network: chainsName[assetToUnlock.chainId],
      colors: assetToUnlock.colors as TokenColors,
    } as ParsedAsset,
    data: approval.data,
    value: approval.value?.toString(),
    changes: [],
    from: parameters.fromAddress,
    to: assetAddress,
    hash: approval.hash as TxHash,
    network: chainsName[chainId],
    chainId: approval.chainId,
    nonce: approval.nonce,
    status: TransactionStatus.pending,
    type: 'approve',
    approvalAmount: isUnlimited ? 'UNLIMITED' : approvalAmount,
    ...gasParams,
  } satisfies NewTransaction;

  addNewTransaction({
    address: parameters.fromAddress as Address,
    chainId: approval.chainId,
    transaction,
  });

  return {
    nonce: approval?.nonce,
    hash: approval?.hash,
  };
};
