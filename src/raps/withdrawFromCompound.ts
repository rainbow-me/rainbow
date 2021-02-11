import { createNewAction, createNewRap, RapActionTypes } from './common';
import store from '@rainbow-me/redux/store';
import { ethUnits } from '@rainbow-me/references';
import logger from 'logger';

export const estimateWithdrawFromCompound = () => ethUnits.basic_withdrawal;

export const createWithdrawFromCompoundRap = () => {
  const { inputAmount, inputCurrency, isMax } = store.getState().swap;
  logger.log('[withdraw rap] withdraw', inputCurrency);
  const { selectedGasPrice } = store.getState().gas;
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
  const newRap = createNewRap(actions);
  return newRap;
};
