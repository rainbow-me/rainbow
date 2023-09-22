import { MaxUint256 } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { Signer } from '@ethersproject/abstract-signer';
import {
  ALLOWS_PERMIT,
  PermitSupportedTokenList,
  RAINBOW_ROUTER_CONTRACT_ADDRESS,
} from '@rainbow-me/swaps';
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
import { parseGasParamAmounts } from '@/parsers';
import { dataAddNewTransaction } from '@/redux/data';
import store from '@/redux/store';
import { erc20ABI, ETH_ADDRESS, ethUnits } from '@/references';
import { convertAmountToRawAmount, greaterThan } from '@/helpers/utilities';
import { AllowancesCache, ethereumUtils } from '@/utils';
import { overrideWithFastSpeedIfNeeded } from '../utils';
import logger from '@/utils/logger';

export const estimateApprove = async (
  owner: string,
  tokenAddress: string,
  spender: string,
  chainId = 1,
  allowsPermit = true
): Promise<number | string> => {
  try {
    if (
      allowsPermit &&
      ALLOWS_PERMIT[
        tokenAddress?.toLowerCase() as keyof PermitSupportedTokenList
      ]
    ) {
      return '0';
    }

    const network = ethereumUtils.getNetworkFromChainId(chainId);
    const provider = await getProviderForNetwork(network);
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
  chainId = 1
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
  wallet: Signer,
  nonce: number | null = null,
  chainId = 1
) => {
  const exchange = new Contract(tokenAddress, erc20ABI, wallet);
  return exchange.approve(spender, MaxUint256, {
    gasLimit: toHex(gasLimit) || undefined,
    // In case it's an L2 with legacy gas price like arbitrum
    gasPrice: gasParams.gasPrice,
    // EIP-1559 like networks
    maxFeePerGas: gasParams.maxFeePerGas,
    maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
    nonce: nonce ? toHex(nonce) : undefined,
  });
};

const actionName = 'unlock';

const unlock = async (
  wallet: Signer,
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
    const contractAllowsPermit =
      contractAddress === RAINBOW_ROUTER_CONTRACT_ADDRESS;
    gasLimit = await estimateApprove(
      accountAddress,
      assetAddress,
      contractAddress,
      chainId,
      contractAllowsPermit
    );
  } catch (e) {
    logger.sentry(`[${actionName}] Error estimating gas`);
    captureException(e);
    throw e;
  }
  let approval;
  let gasParams = parseGasParamAmounts(selectedGasFee);

  try {
    gasParams = overrideWithFastSpeedIfNeeded({
      gasParams,
      chainId,
      gasFeeParamsBySpeed,
    });

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
  const walletAddress = await wallet.getAddress();
  const cacheKey = `${walletAddress}|${assetAddress}|${contractAddress}`.toLowerCase();

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

  const allowance = await getRawAllowance(
    accountAddress,
    assetToUnlock,
    contractAddress,
    chainId
  );

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
