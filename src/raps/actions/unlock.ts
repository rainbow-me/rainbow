import { MaxUint256 } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { ALLOWS_PERMIT, PermitSupportedTokenList } from '@rainbow-me/swaps';
import { captureException } from '@sentry/react-native';
import { isNull } from 'lodash';
import { alwaysRequireApprove } from '../../config/debug';
import {
  Rap,
  RapExchangeActionParameters,
  UnlockActionParameters,
} from '../common';
import { Asset, TransactionStatus, TransactionType } from '@/entities';
import { getProviderForNetwork, toHex } from '@/handlers/web3';
import { parseGasParamsForTransaction } from '@/parsers';
import { dataAddNewTransaction } from '@/redux/data';
import store from '@/redux/store';
import { erc20ABI, ETH_ADDRESS, ethUnits } from '@/references';
import { convertAmountToRawAmount, greaterThan } from '@/helpers/utilities';
import { AllowancesCache, ethereumUtils, gasUtils } from '@/utils';
import logger from '@/utils/logger';

export const estimateApprove = async (
  owner: string,
  tokenAddress: string,
  spender: string,
  chainId: number = 1
): Promise<number | string> => {
  try {
    const network = ethereumUtils.getNetworkFromChainId(chainId);
    const provider = await getProviderForNetwork(network);
    if (
      ALLOWS_PERMIT[
        tokenAddress?.toLowerCase() as keyof PermitSupportedTokenList
      ]
    ) {
      return '0';
    }

    logger.sentry('exchange estimate approve', {
      owner,
      spender,
      tokenAddress,
    });
    const tokenContract = new Contract(tokenAddress, erc20ABI, provider);
    const gasLimit = await tokenContract.estimateGas.approve(
      spender,
      MaxUint256,
      {
        from: owner,
      }
    );
    return gasLimit ? gasLimit.toString() : ethUnits.basic_approval;
  } catch (error) {
    logger.sentry('error estimateApproveWithExchange');
    captureException(error);
    return ethUnits.basic_approval;
  }
};

const getRawAllowance = async (
  owner: string,
  token: Asset,
  spender: string,
  chainId: number = 1
) => {
  try {
    const network = ethereumUtils.getNetworkFromChainId(chainId);
    const provider = await getProviderForNetwork(network);
    const { address: tokenAddress } = token;
    const tokenContract = new Contract(tokenAddress, erc20ABI, provider);
    const allowance = await tokenContract.allowance(owner, spender);
    return allowance.toString();
  } catch (error) {
    logger.sentry('error getRawAllowance');
    captureException(error);
    return null;
  }
};

const executeApprove = async (
  tokenAddress: string,
  spender: string,
  gasLimit: number | string,
  gasParams:
    | {
        gasPrice: string;
        maxFeePerGas?: undefined;
        maxPriorityFeePerGas?: undefined;
      }
    | {
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
        gasPrice?: undefined;
      },
  wallet: Wallet,
  nonce: number | null = null,
  chainId: number = 1
) => {
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  let provider = await getProviderForNetwork(network);
  const walletToUse = new Wallet(wallet.privateKey, provider);

  const exchange = new Contract(tokenAddress, erc20ABI, walletToUse);
  return exchange.approve(spender, MaxUint256, {
    gasLimit: toHex(gasLimit) || undefined,
    // In case it's an L2 with legacy gas price like arbitrum
    gasPrice: gasParams.gasPrice || undefined,
    // EIP-1559 like networks
    maxFeePerGas: gasParams.maxFeePerGas || undefined,
    maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas || undefined,
    nonce: nonce ? toHex(nonce) : undefined,
  });
};

const actionName = 'unlock';

const unlock = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapExchangeActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const { dispatch } = store;
  const { accountAddress } = store.getState().settings;
  const { gasFeeParamsBySpeed, selectedGasFee } = store.getState().gas;
  const {
    assetToUnlock,
    contractAddress,
    chainId,
  } = parameters as UnlockActionParameters;
  const { address: assetAddress } = assetToUnlock;

  logger.log(`[${actionName}] rap for`, assetToUnlock);

  let gasLimit;
  try {
    logger.sentry(`[${actionName}] estimate gas`, {
      assetAddress,
      contractAddress,
    });
    gasLimit = await estimateApprove(
      accountAddress,
      assetAddress,
      contractAddress,
      chainId
    );
  } catch (e) {
    logger.sentry(`[${actionName}] Error estimating gas`);
    captureException(e);
    throw e;
  }
  let approval;
  let gasParams = parseGasParamsForTransaction(selectedGasFee);
  // if swap isn't the last action, use fast gas or custom (whatever is faster)
  if (
    !gasParams.maxFeePerGas ||
    !gasParams.maxPriorityFeePerGas ||
    !gasParams.gasPrice
  ) {
    try {
      // approvals should always use fast gas or custom (whatever is faster)
      const fastMaxFeePerGas =
        gasFeeParamsBySpeed?.[gasUtils.FAST]?.maxFeePerGas?.amount;
      const fastMaxPriorityFeePerGas =
        gasFeeParamsBySpeed?.[gasUtils.FAST]?.maxPriorityFeePerGas?.amount;

      if (greaterThan(fastMaxFeePerGas, gasParams?.maxFeePerGas || 0)) {
        gasParams.maxFeePerGas = fastMaxFeePerGas;
      }
      if (
        greaterThan(
          fastMaxPriorityFeePerGas,
          gasParams?.maxPriorityFeePerGas || 0
        )
      ) {
        gasParams.maxPriorityFeePerGas = fastMaxPriorityFeePerGas;
      }

      logger.sentry(`[${actionName}] about to approve`, {
        assetAddress,
        contractAddress,
        gasLimit,
      });
      const nonce = baseNonce ? baseNonce + index : null;
      approval = await executeApprove(
        assetAddress,
        contractAddress,
        gasLimit,
        gasParams,
        wallet,
        nonce,
        chainId
      );
    } catch (e) {
      logger.sentry(`[${actionName}] Error approving`);
      captureException(e);
      throw e;
    }
  }

  const cacheKey = `${wallet.address}|${assetAddress}|${contractAddress}`.toLowerCase();

  // Cache the approved value
  AllowancesCache.cache[cacheKey] = MaxUint256.toString();

  logger.log(`[${actionName}] response`, approval);

  const newTransaction = {
    amount: 0,
    asset: assetToUnlock,
    data: approval.data,
    from: accountAddress,
    gasLimit,
    hash: approval?.hash,
    network: ethereumUtils.getNetworkFromChainId(Number(chainId)),
    nonce: approval?.nonce,
    status: TransactionStatus.approving,
    to: approval?.to,
    type: TransactionType.authorize,
    value: toHex(approval.value),
    ...gasParams,
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);
  // @ts-expect-error Since src/redux/data.js is not typed yet, `accountAddress`
  // being a string conflicts with the inferred type of "null" for the second
  // parameter.
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress));
  return approval?.nonce;
};

export const assetNeedsUnlocking = async (
  accountAddress: string,
  amount: string,
  assetToUnlock: Asset,
  contractAddress: string,
  chainId = 1
) => {
  logger.log('checking asset needs unlocking');
  const { address } = assetToUnlock;
  if (address === ETH_ADDRESS) return false;
  if (alwaysRequireApprove) return true;

  const cacheKey = `${accountAddress}|${address}|${contractAddress}`.toLowerCase();

  let allowance;
  // Check on cache first
  // if (AllowancesCache.cache[cacheKey]) {
  //   allowance = AllowancesCache.cache[cacheKey];
  // } else {
  allowance = await getRawAllowance(
    accountAddress,
    assetToUnlock,
    contractAddress,
    chainId
  );

  // Cache that value
  // if (!isNull(allowance)) {
  //   AllowancesCache.cache[cacheKey] = allowance;
  // }
  //}

  logger.log('raw allowance', allowance.toString());
  // Cache that value
  if (!isNull(allowance)) {
    AllowancesCache.cache[cacheKey] = allowance;
  }

  const rawAmount = convertAmountToRawAmount(amount, assetToUnlock.decimals);
  const needsUnlocking = !greaterThan(allowance, rawAmount);
  logger.log('asset needs unlocking?', needsUnlocking, allowance.toString());
  return needsUnlocking;
};

export default unlock;
