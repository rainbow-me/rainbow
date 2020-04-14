import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import { ethUnits } from '../references';
import { logger } from '../utils';
import { createNewAction, createNewRap, RapActionTypes } from './common';

export const estimateWithdrawFromCompound = () => ethUnits.basic_withdrawal;

const createWithdrawFromCompoundRap = ({
  inputCurrency,
  inputAmount,
  isMax,
  selectedGasPrice,
  callback,
}) => {
  logger.log('[withdraw rap] withdraw', inputCurrency);
  const { accountAddress, network } = store.getState().settings;

  // create a withdraw rap
  logger.log('[withdraw rap] making redeem func');
  const withdraw = createNewAction(RapActionTypes.withdrawCompound, {
    accountAddress,
    inputAmount,
    inputCurrency,
    isMax,
    network,
    selectedGasPrice,
  });
  const actions = [withdraw];

  // create the overall rap
  const newRap = createNewRap(actions, callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  logger.log('[withdraw rap] new rap!', newRap);
  return newRap;
};

export default createWithdrawFromCompoundRap;
