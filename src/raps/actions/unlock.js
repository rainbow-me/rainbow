import { ethers } from 'ethers';
import { get } from 'lodash';
import transactionStatusTypes from '../../helpers/transactionStatusTypes';
import transactionTypes from '../../helpers/transactionTypes';
import {
  convertAmountToRawAmount,
  greaterThan,
  isZero,
} from '../../helpers/utilities';
import { dataAddNewTransaction } from '../../redux/data';
import { rapsAddOrUpdate } from '../../redux/raps';
import store from '../../redux/store';
import { AllowancesCache, contractUtils, gasUtils, logger } from '../../utils';

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
  const gasLimit = await contractUtils.estimateApprove(
    assetAddress,
    contractAddress
  );

  const { approval } = await contractUtils.approve(
    assetAddress,
    contractAddress,
    gasLimit,
    get(fastGasPrice, 'value.amount'),
    wallet
  );
  // Cache the approved value
  AllowancesCache.cache[
    `${wallet.address}|${assetToUnlock}|${contractAddress}`
  ] = ethers.constants.MaxUint256;

  // update rap for hash
  currentRap.actions[index].transaction.hash = approval.hash;
  logger.log('[unlock] adding a new txn for the approval', approval.hash);
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));

  logger.log('[unlock] add a new txn');
  dispatch(
    dataAddNewTransaction({
      amount: 0,
      asset: assetToUnlock,
      from: wallet.address,
      hash: approval.hash,
      nonce: get(approval, 'nonce'),
      status: transactionStatusTypes.approving,
      to: get(approval, 'to'),
      type: transactionTypes.authorize,
    })
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

  let allowance;
  // Check on cache first
  if (
    AllowancesCache.cache[
      `${accountAddress}|${assetToUnlock}|${contractAddress}`
    ]
  ) {
    allowance =
      AllowancesCache.cache[
        `${accountAddress}|${assetToUnlock}|${contractAddress}`
      ];
  } else {
    allowance = await contractUtils.getAllowance(
      accountAddress,
      assetToUnlock,
      contractAddress
    );
    // Cache that value
    AllowancesCache.cache[
      `${accountAddress}|${assetToUnlock}|${contractAddress}`
    ] = allowance;
  }

  const rawAmount = convertAmountToRawAmount(amount, assetToUnlock.decimals);
  return !greaterThan(allowance, rawAmount);
};

export default unlock;
