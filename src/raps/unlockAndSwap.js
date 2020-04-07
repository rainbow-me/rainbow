import { concat } from 'lodash';
import store from '../redux/store';
import { rapsAddOrUpdate } from '../redux/raps';
import { assetNeedsUnlocking } from './actions/unlock';
import { createNewAction, createNewRap, RapActionTypes } from './common';

const createUnlockAndSwapRap = ({
  callback,
  inputAmount,
  inputAsExactAmount,
  inputCurrency,
  inputReserve,
  outputAmount,
  outputCurrency,
  outputReserve,
  selectedGasPrice,
}) => {
  // create unlock rap
  const { accountAddress, chainId } = store.getState().settings;

  let actions = [];

  const swapAssetNeedsUnlocking = assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    inputCurrency.exchangeAddress
  );
  if (swapAssetNeedsUnlocking) {
    const unlock = createNewAction(RapActionTypes.unlock, {
      accountAddress,
      amount: inputAmount,
      assetToUnlock: inputCurrency,
      contractAddress: inputCurrency.exchangeAddress,
    });
    actions = concat(actions, unlock);
  }

  // create a swap rap
  const swap = createNewAction(RapActionTypes.swap, {
    accountAddress,
    chainId,
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    inputReserve,
    outputAmount,
    outputCurrency,
    outputReserve,
    selectedGasPrice,
  });
  actions = concat(actions, swap);

  // create the overall rap
  const newRap = createNewRap(actions, callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  return newRap;
};

export default createUnlockAndSwapRap;
