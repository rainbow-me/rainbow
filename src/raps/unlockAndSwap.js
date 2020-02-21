import store from '../redux/store';
import { rapsAddOrUpdate } from '../redux/raps';
import { createNewAction, createNewRap, RapActionTypes } from './common';

const NOOP = () => undefined;

const createUnlockAndSwapRap = (
  inputCurrency,
  outputCurrency,
  inputAmount,
  outputAmount,
  selectedGasPrice = null,
  inputAsExactAmount,
  callback = NOOP
) => {
  // create unlock rap
  const unlock = createNewAction(RapActionTypes.unlock, {
    assetToUnlock: inputCurrency,
    contractAddress: inputCurrency.exchangeAddress,
  });

  // create a swap rap
  const swap = createNewAction(RapActionTypes.swap, {
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    outputAmount,
    outputCurrency,
    selectedGasPrice,
  });

  // create the overall rap
  const newRap = createNewRap([unlock, swap], callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  return newRap;
};

export default createUnlockAndSwapRap;
