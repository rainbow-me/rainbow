import { get, toLower } from 'lodash';
import {
  greaterThan,
  isZero,
  convertAmountToRawAmount,
} from '../../helpers/utilities';
import transactionStatusTypes from '../../helpers/transactionStatusTypes';
import transactionTypes from '../../helpers/transactionTypes';
import store from '../../redux/store';
import { dataAddNewTransaction } from '../../redux/data';
import { rapsAddOrUpdate } from '../../redux/raps';
import { contractUtils, gasUtils } from '../../utils';

const NOOP = () => undefined;

const unlock = async (wallet, currentRap, index, parameters) => {
  const { dispatch } = store;
  const {
    accountAddress,
    amount,
    assetToUnlock,
    contractAddress,
    override,
  } = parameters;
  const _amount = override || amount;
  console.log(
    '[unlock] begin unlock rap for',
    assetToUnlock,
    'on',
    contractAddress
  );
  console.log('[unlock]', amount, override, _amount);

  const needsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    _amount,
    assetToUnlock,
    contractAddress
  );

  console.log('[unlock] does this thing need unlocking?', needsUnlocking);
  currentRap.actions[index].transaction.confirmed = true;
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  if (!needsUnlocking) return _amount;

  console.log('[unlock] unlock needed');
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

  // update rap for hash
  currentRap.actions[index].transaction.hash = approval.hash;
  console.log('[unlock] adding a new txn for the approval', approval.hash);
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));

  console.log('[unlock] add a new txn');
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
  console.log('[unlock] calling callback');
  currentRap.callback();
  currentRap.callback = NOOP;

  console.log('[unlock] APPROVAL SUBMITTED, HASH', approval.hash);
  console.log('[unlock] WAITING TO BE MINED...');
  try {
    const receipt = await wallet.provider.waitForTransaction(approval.hash);
    if (!isZero(receipt.status)) {
      // update rap for confirmed status
      currentRap.actions[index].transaction.confirmed = true;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
      console.log('[unlock] APPROVED');
    } else {
      console.log('[unlock] error waiting for approval');
      currentRap.actions[index].transaction.confirmed = false;
      dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
    }
  } catch (error) {
    console.log('[unlock] approval status not success', error);
    currentRap.actions[index].transaction.confirmed = false;
    dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  }
  console.log('[unlock] completed', currentRap, approval);
  return _amount;
};

const assetNeedsUnlocking = async (
  accountAddress,
  amount,
  assetToUnlock,
  contractAddress
) => {
  const { address } = assetToUnlock;
  const _address = toLower(_address);
  const _contractAddress = toLower(_contractAddress);
  console.log('checking asset needs unlocking');
  const isInputEth = address === 'eth';
  if (isInputEth) {
    return false;
  }
  const allowance = await contractUtils.getAllowance(
    accountAddress,
    assetToUnlock,
    contractAddress
  );

  const rawAmount = convertAmountToRawAmount(amount, assetToUnlock.decimals);
  return !greaterThan(allowance, rawAmount);
};

export default unlock;
