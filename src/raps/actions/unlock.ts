import { MaxUint256 } from '@ethersproject/constants';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { get, isNull, toLower } from 'lodash';
import { alwaysRequireApprove } from '../../config/debug';
import { Rap, RapActionParameters, UnlockActionParameters } from '../common';
import { Asset } from '@rainbow-me/entities';
import TransactionStatusTypes from '@rainbow-me/helpers/transactionStatusTypes';
import TransactionTypes from '@rainbow-me/helpers/transactionTypes';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import { convertAmountToRawAmount, greaterThan } from '@rainbow-me/utilities';
import { AllowancesCache, contractUtils, gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

const unlock = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapActionParameters
): Promise<null> => {
  const { dispatch } = store;
  const {
    accountAddress,
    amount,
    assetToUnlock,
    contractAddress,
    selectedGasPrice,
  } = parameters as UnlockActionParameters;
  logger.log(
    '[unlock] begin unlock rap for',
    assetToUnlock,
    'on',
    contractAddress
  );
  logger.log('[unlock]', amount);

  const { gasPrices } = store.getState().gas;

  const { address: assetAddress } = assetToUnlock;

  let gasLimit;
  try {
    logger.sentry('about to estimate approve', {
      assetAddress,
      contractAddress,
    });
    gasLimit = await contractUtils.estimateApprove(
      accountAddress,
      assetAddress,
      contractAddress
    );
  } catch (e) {
    logger.sentry('Error estimating approve');
    captureException(e);
    throw e;
  }
  let approval;
  let gasPrice;
  try {
    logger.log('[swap] execute the swap');
    // unlocks should always use fast gas or custom (whatever is faster)
    gasPrice = get(selectedGasPrice, 'value.amount');
    const fastPrice = get(gasPrices, `[${gasUtils.FAST}].value.amount`);
    if (greaterThan(fastPrice, gasPrice)) {
      gasPrice = fastPrice;
    }

    logger.sentry('about to approve', {
      assetAddress,
      contractAddress,
      gasLimit,
    });
    const result = await contractUtils.approve(
      assetAddress,
      contractAddress,
      gasLimit,
      gasPrice,
      wallet
    );
    approval = result?.approval;
  } catch (e) {
    logger.sentry('Error approving');
    captureException(e);
    throw e;
  }

  const cacheKey = toLower(
    `${wallet.address}|${assetAddress}|${contractAddress}`
  );

  // Cache the approved value
  AllowancesCache.cache[cacheKey] = MaxUint256.toString();

  // update rap for hash
  currentRap.actions[index].transaction.hash = approval.hash;
  logger.log('[unlock] adding a new txn for the approval', approval.hash);

  logger.log('[unlock] add a new txn');
  await dispatch(
    dataAddNewTransaction(
      {
        amount: 0,
        asset: assetToUnlock,
        from: wallet.address,
        gasLimit,
        gasPrice,
        hash: approval.hash,
        nonce: get(approval, 'nonce'),
        status: TransactionStatusTypes.approving,
        to: get(approval, 'to'),
        type: TransactionTypes.authorize,
      },
      wallet.address
    )
  );

  logger.log('[unlock] APPROVAL SUBMITTED, HASH', approval.hash);
  return null;
};

export const assetNeedsUnlocking = async (
  accountAddress: string,
  amount: string,
  assetToUnlock: Asset,
  contractAddress: string
) => {
  const { address } = assetToUnlock;
  logger.log('checking asset needs unlocking');
  const isInputEth = address === 'eth';
  if (isInputEth) {
    return false;
  }

  if (alwaysRequireApprove) return true;

  const cacheKey = toLower(`${accountAddress}|${address}|${contractAddress}`);

  let allowance;
  // Check on cache first
  if (AllowancesCache.cache[cacheKey]) {
    allowance = AllowancesCache.cache[cacheKey];
  } else {
    allowance = await contractUtils.getRawAllowance(
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
