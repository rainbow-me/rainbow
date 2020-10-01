import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import { ethUnits } from '../references';
import { createNewAction, createNewRap, RapActionTypes } from './common';
import logger from 'logger';

export const estimateWithdrawFromCompound = () => ethUnits.basic_withdrawal;

const createWithdrawFromCompoundRap = ({
  callback,
  inputAmount,
  inputCurrency,
  isMax,
  selectedGasPrice,
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
