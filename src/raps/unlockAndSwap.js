import store from '../redux/store';
import { rapsAddOrUpdate } from '../redux/raps';
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
  const unlock = createNewAction(RapActionTypes.unlock, {
    accountAddress,
    amount: inputAmount,
    assetToUnlock: inputCurrency,
    contractAddress: inputCurrency.exchangeAddress,
  });

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

  // create the overall rap
  const newRap = createNewRap([unlock, swap], callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  return newRap;
};

export default createUnlockAndSwapRap;
