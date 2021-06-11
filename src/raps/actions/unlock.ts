import { MaxUint256 } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { get, isNull, toLower } from 'lodash';
import { alwaysRequireApprove } from '../../config/debug';
import { Rap, RapActionParameters, UnlockActionParameters } from '../common';
import {
  Asset,
  TransactionStatus,
  TransactionType,
} from '@rainbow-me/entities';
import { toHex, web3Provider } from '@rainbow-me/handlers/web3';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import { erc20ABI, ETH_ADDRESS, ethUnits } from '@rainbow-me/references';
import { convertAmountToRawAmount, greaterThan } from '@rainbow-me/utilities';
import { AllowancesCache, gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

export const estimateApprove = async (
  owner: string,
  tokenAddress: string,
  spender: string
): Promise<number | string> => {
  try {
    logger.sentry('exchange estimate approve', {
      owner,
      spender,
      tokenAddress,
    });
    const exchange = new Contract(tokenAddress, erc20ABI, web3Provider);
    const gasLimit = await exchange.estimateGas.approve(spender, MaxUint256, {
      from: owner,
    });
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
  spender: string
) => {
  try {
    const { address: tokenAddress } = token;
    const tokenContract = new Contract(tokenAddress, erc20ABI, web3Provider);
    const allowance = await tokenContract.allowance(owner, spender);
    return allowance.toString();
  } catch (error) {
    logger.sentry('error getRawAllowance');
    captureException(error);
    return null;
  }
};

const executeApprove = (
  tokenAddress: string,
  spender: string,
  gasLimit: number | string,
  gasPrice: string,
  wallet: Wallet,
  nonce: number | null = null
) => {
  const exchange = new Contract(tokenAddress, erc20ABI, wallet);
  return exchange.approve(spender, MaxUint256, {
    gasLimit: toHex(gasLimit) || undefined,
    gasPrice: toHex(gasPrice) || undefined,
    nonce: nonce ? toHex(nonce) : undefined,
  });
};

const actionName = 'unlock';

const unlock = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const { dispatch } = store;
  const { accountAddress } = store.getState().settings;
  const { gasPrices, selectedGasPrice } = store.getState().gas;
  const {
    assetToUnlock,
    contractAddress,
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
      contractAddress
    );
  } catch (e) {
    logger.sentry(`[${actionName}] Error estimating gas`);
    captureException(e);
    throw e;
  }
  let approval;
  let gasPrice;
  try {
    // approvals should always use fast gas or custom (whatever is faster)
    gasPrice = selectedGasPrice?.value?.amount;
    const fastPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
    if (greaterThan(fastPrice, gasPrice)) {
      gasPrice = fastPrice;
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
      gasPrice,
      wallet,
      nonce
    );
  } catch (e) {
    logger.sentry(`[${actionName}] Error approving`);
    captureException(e);
    throw e;
  }

  const cacheKey = toLower(
    `${wallet.address}|${assetAddress}|${contractAddress}`
  );

  // Cache the approved value
  AllowancesCache.cache[cacheKey] = MaxUint256.toString();

  logger.log(`[${actionName}] response`, approval);

  const newTransaction = {
    amount: 0,
    asset: assetToUnlock,
    from: accountAddress,
    gasLimit,
    gasPrice,
    hash: approval?.hash,
    nonce: approval?.nonce,
    status: TransactionStatus.approving,
    to: approval?.to,
    type: TransactionType.authorize,
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);
  await dispatch(dataAddNewTransaction(newTransaction, accountAddress));
  return approval?.nonce;
};

export const assetNeedsUnlocking = async (
  accountAddress: string,
  amount: string,
  assetToUnlock: Asset,
  contractAddress: string
) => {
  logger.log('checking asset needs unlocking');
  const { address } = assetToUnlock;
  if (address === ETH_ADDRESS) return false;
  if (alwaysRequireApprove) return true;

  const cacheKey = toLower(`${accountAddress}|${address}|${contractAddress}`);

  let allowance;
  // Check on cache first
  if (AllowancesCache.cache[cacheKey]) {
    allowance = AllowancesCache.cache[cacheKey];
  } else {
    allowance = await getRawAllowance(
      accountAddress,
      assetToUnlock,
      contractAddress
    );

    // Cache that value
    if (!isNull(allowance)) {
      AllowancesCache.cache[cacheKey] = allowance;
    }
  }

  const rawAmount = convertAmountToRawAmount(amount, assetToUnlock.decimals);
  const needsUnlocking = !greaterThan(allowance, rawAmount);
  logger.log('asset needs unlocking?', needsUnlocking);
  return needsUnlocking;
};

export default unlock;
