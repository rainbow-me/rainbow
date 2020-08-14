import { MaxUint256 } from '@ethersproject/constants';
import { captureException } from '@sentry/react-native';
import { get, toLower } from 'lodash';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import TransactionTypes from '../../helpers/transactionTypes';
import {
  convertAmountToRawAmount,
  greaterThan,
  isZero,
} from '../../helpers/utilities';
import { dataAddNewTransaction } from '../../redux/data';
import { rapsAddOrUpdate } from '../../redux/raps';
import store from '../../redux/store';
import { AllowancesCache, contractUtils, gasUtils } from '../../utils';
import logger from 'logger';

const NOOP = () => undefined;

const unlock = async (wallet, currentRap, index, parameters) => {
  const { dispatch } = store;
  const { amount, assetToUnlock, contractAddress, override } = parameters;
  const _amount = override || amount;
  logger.log(
    '[unlock] begin unlock rap for',
    assetToUnlock,
    'on',
    contractAddress
  );
  logger.log('[unlock]', amount, override, _amount);

  const { gasPrices } = store.getState().gas;
  const { address: assetAddress } = assetToUnlock;

  // unlocks should always use fast gas
  const fastGasPrice = get(gasPrices, `[${gasUtils.FAST}]`);
  let gasLimit;
  try {
    logger.sentry('about to estimate approve', {
      assetAddress,
      contractAddress,
    });
    gasLimit = await contractUtils.estimateApprove(
      assetAddress,
      contractAddress
    );
  } catch (e) {
    logger.sentry('Error estimating approve');
    captureException(e);
    throw e;
  }
  let approval;
  try {
    const gasPrice = get(fastGasPrice, 'value.amount');
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
  AllowancesCache.cache[cacheKey] = MaxUint256;

  // update rap for hash
  currentRap.actions[index].transaction.hash = approval.hash;
  logger.log('[unlock] adding a new txn for the approval', approval.hash);
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));

  logger.log('[unlock] add a new txn');
  await dispatch(
    dataAddNewTransaction(
      {
        amount: 0,
        asset: assetToUnlock,
        from: wallet.address,
        hash: approval.hash,
        nonce: get(approval, 'nonce'),
        status: TransactionStatusTypes.approving,
        to: get(approval, 'to'),
        type: TransactionTypes.authorize,
      },
      wallet.address
    )
  );
  logger.log('[unlock] calling callback');
  currentRap.callback();
  currentRap.callback = NOOP;

  logger.log('[unlock] APPROVAL SUBMITTED, HASH', approval.hash);
  logger.log('[unlock] WAITING TO BE MINED...');
  try {
    const receipt = await wallet.provider.waitForTransaction(approval.hash);
    if (!isZero(receipt.status)) {
      // update rap for confirmed status
      currentRap.actions[index].transaction.confirmed = true;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
      logger.log('[unlock] APPROVED');
    } else {
      logger.log('[unlock] error waiting for approval');
      currentRap.actions[index].transaction.confirmed = false;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
    }
  } catch (error) {
    logger.log('[unlock] approval status not success', error);
    currentRap.actions[index].transaction.confirmed = false;
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  }
  logger.log('[unlock] completed', currentRap, approval);
  return _amount;
};

export const assetNeedsUnlocking = async (
  accountAddress,
  amount,
  assetToUnlock,
  contractAddress
) => {
  const { address } = assetToUnlock;
  logger.log('checking asset needs unlocking');
  const isInputEth = address === 'eth';
  if (isInputEth) {
    return false;
  }

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
    AllowancesCache.cache[cacheKey] = allowance;
  }

  const rawAmount = convertAmountToRawAmount(amount, assetToUnlock.decimals);
  const assetNeedsUnlocking = !greaterThan(allowance, rawAmount);
  logger.log('asset needs unlocking?', assetNeedsUnlocking);
  return assetNeedsUnlocking;
};

export default unlock;
