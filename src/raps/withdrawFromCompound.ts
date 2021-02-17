import { createNewAction, createNewRap, RapActionTypes } from './common';
import { Asset, SelectedGasPrice } from '@rainbow-me/entities';
import { rapsAddOrUpdate } from '@rainbow-me/redux/raps';
import store from '@rainbow-me/redux/store';
import { ethUnits } from '@rainbow-me/references';
import logger from 'logger';

export const estimateWithdrawFromCompound = () => ethUnits.basic_withdrawal;

export const createWithdrawFromCompoundRap = ({
  callback,
  inputAmount,
  inputCurrency,
  isMax,
  selectedGasPrice,
}: {
  callback: () => void;
  inputAmount: string | null;
  inputCurrency: Asset;
  isMax: boolean;
  selectedGasPrice: SelectedGasPrice;
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
