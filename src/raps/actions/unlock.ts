import { Signer } from '@ethersproject/abstract-signer';
import { MaxUint256 } from '@ethersproject/constants';
import { Contract, PopulatedTransaction } from '@ethersproject/contracts';
import { parseUnits } from '@ethersproject/units';
import { getProviderForNetwork } from '@/handlers/web3';
import { Address, erc20Abi, erc721Abi, getContract, createWalletClient, http, Hex } from 'viem';

import { ChainId } from '@/__swaps__/types/chains';
import { TransactionGasParams, TransactionLegacyGasParams } from '@/__swaps__/types/gas';
import { NewTransaction } from '@/entities/transactions';
import { TxHash } from '@/resources/transactions/types';
import { addNewTransaction } from '@/state/pendingTransactions';
import { RainbowError, logger } from '@/logger';

import { ETH_ADDRESS } from '../../references';
import { gasUnits } from '@/__swaps__/references';
import { gasStore } from '@/state/gas/gasStore';
import { ParsedAsset } from '@/__swaps__/types/assets';
import { toBigNumber } from '@/__swaps__/utils/numbers';
import { convertAmountToRawAmount, greaterThan } from '@/helpers/utilities';
import { ActionProps, RapActionResult } from '../references';

import { overrideWithFastSpeedIfNeeded } from './../utils';
import { ethereumUtils } from '@/utils';
import { getNetworkObj } from '@/networks';

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
    // TODO: MARK - Replace this once we migrate network => chainId
    const provider = await getProviderForNetwork(ethereumUtils.getNetworkFromChainId(chainId));
    const tokenContract = new Contract(assetAddress, erc20Abi, provider);
    const allowance = await tokenContract.allowance(owner, spender);
    return allowance.toString();
  } catch (error) {
    logger.error(new RainbowError('getRawAllowance: error'), {
      message: (error as Error)?.message,
    });
    return null;
  }
};

export const assetNeedsUnlocking = async ({
  owner,
  amount,
  assetToUnlock,
  spender,
  chainId,
}: {
  owner: Address;
  amount: string;
  assetToUnlock: ParsedAsset;
  spender: Address;
  chainId: ChainId;
}) => {
  if (assetToUnlock.isNativeAsset || assetToUnlock.address === ETH_ADDRESS) return false;

  const allowance = await getAssetRawAllowance({
    owner,
    assetAddress: assetToUnlock.address,
    spender,
    chainId,
  });

  const rawAmount = convertAmountToRawAmount(amount, assetToUnlock.decimals);
  const needsUnlocking = !greaterThan(allowance, rawAmount);
  return needsUnlocking;
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
    // TODO: MARK - Replace this once we migrate network => chainId
    const provider = await getProviderForNetwork(ethereumUtils.getNetworkFromChainId(chainId));
    const tokenContract = new Contract(tokenAddress, erc20Abi, provider);
    const gasLimit = await tokenContract.estimateGas.approve(spender, MaxUint256, {
      from: owner,
    });
    return gasLimit ? gasLimit.toString() : `${gasUnits.basic_approval}`;
  } catch (error) {
    logger.error(new RainbowError('unlock: error estimateApprove'), {
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
}: {
  owner: Address;
  tokenAddress: Address;
  spender: Address;
  chainId: ChainId;
}): Promise<PopulatedTransaction | null> => {
  try {
    // TODO: MARK - Replace this once we migrate network => chainId
    const provider = await getProviderForNetwork(ethereumUtils.getNetworkFromChainId(chainId));
    const tokenContract = new Contract(tokenAddress, erc20Abi, provider);
    const approveTransaction = await tokenContract.populateTransaction.approve(spender, MaxUint256, {
      from: owner,
    });
    return approveTransaction;
  } catch (error) {
    logger.error(new RainbowError(' error populateApprove'), {
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
    // TODO: MARK - Replace this once we migrate network => chainId
    const provider = await getProviderForNetwork(ethereumUtils.getNetworkFromChainId(chainId));
    const tokenContract = new Contract(tokenAddress, erc721Abi, provider);
    const gasLimit = await tokenContract.estimateGas.setApprovalForAll(spender, false, {
      from: owner,
    });
    return gasLimit ? gasLimit.toString() : `${gasUnits.basic_approval}`;
  } catch (error) {
    logger.error(new RainbowError('estimateERC721Approval: error estimateApproval'), {
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
  // TODO: MARK - Replace this once we migrate network => chainId
  const provider = await getProviderForNetwork(ethereumUtils.getNetworkFromChainId(chainId));
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
  chainId,
  gasLimit,
  gasParams,
  nonce,
  spender,
  tokenAddress,
  wallet,
}: {
  chainId: ChainId;
  gasLimit: string;
  gasParams: Partial<TransactionGasParams & TransactionLegacyGasParams>;
  nonce?: number;
  spender: Address;
  tokenAddress: Address;
  wallet: Signer;
}) => {
  const address = await wallet.getAddress();
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const networkObj = getNetworkObj(network);
  const client = createWalletClient({
    account: address as Hex,
    chain: networkObj,
    transport: http(networkObj.rpc),
  });

  const tokenContract = getContract({
    address: tokenAddress,
    abi: erc20Abi,
    client,
  });

  const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = gasParams;

  const gasPriceBigInt = toBigNumber(gasPrice)?.toBigInt();
  const maxFeePerGasBigInt = toBigNumber(maxFeePerGas)?.toBigInt();
  const maxPriorityFeePerGasBigInt = toBigNumber(maxPriorityFeePerGas)?.toBigInt();

  if (!gasPriceBigInt || !maxFeePerGasBigInt || !maxPriorityFeePerGasBigInt) {
    throw new RainbowError('unlock: error executeApprove');
  }

  // TODO: Allow user to edit this spend amount
  // TODO: Fix this...
  return tokenContract.write.approve([spender, MaxUint256.toBigInt()], {
    nonce,
    gasLimit: toBigNumber(gasLimit),
    gasPrice: gasPriceBigInt,
    maxFeePerGas: maxFeePerGasBigInt, // TODO: Viem types are screwed up for this?
    maxPriorityFeePerGas: maxPriorityFeePerGasBigInt, // TODO: Viem types are screwed up for this?
  });
};

export const unlock = async ({ baseNonce, index, parameters, wallet }: ActionProps<'unlock'>): Promise<RapActionResult> => {
  const { selectedGas, gasFeeParamsBySpeed } = gasStore.getState();

  const { assetToUnlock, contractAddress, chainId } = parameters;

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
    logger.error(new RainbowError('unlock: error estimateApprove'), {
      message: (e as Error)?.message,
    });
    throw e;
  }

  const gasParams = overrideWithFastSpeedIfNeeded({
    chainId,
    gasFeeParamsBySpeed,
    selectedGas,
  });

  const nonce = baseNonce ? baseNonce + index : undefined;

  let approval;
  try {
    approval = await executeApprove({
      tokenAddress: assetAddress,
      spender: contractAddress,
      gasLimit,
      gasParams,
      wallet,
      nonce,
      chainId,
    });
  } catch (e) {
    logger.error(new RainbowError('unlock: error executeApprove'), {
      message: (e as Error)?.message,
    });
    throw e;
  }

  if (!approval) throw new RainbowError('unlock: error executeApprove');

  const transaction = {
    asset: assetToUnlock,
    data: approval.data,
    value: approval.value?.toString(),
    changes: [],
    from: parameters.fromAddress,
    to: assetAddress,
    hash: approval.hash as TxHash,
    // TODO: MARK - Replace this once we migrate network => chainId
    network: ethereumUtils.getNetworkFromChainId(chainId),
    // chainId: approval.chainId,
    nonce: approval.nonce,
    status: 'pending',
    type: 'approve',
    approvalAmount: 'UNLIMITED',
    ...gasParams,
  } satisfies NewTransaction;

  // TODO: MARK - Replace this once we migrate network => chainId
  const network = ethereumUtils.getNetworkFromChainId(approval.chainId);

  addNewTransaction({
    address: parameters.fromAddress as Address,
    network,
    transaction,
  });

  return {
    nonce: approval?.nonce,
    hash: approval?.hash,
  };
};
