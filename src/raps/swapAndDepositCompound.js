import { concat, toLower } from 'lodash';
import store from '../redux/store';
import { rapsAddOrUpdate } from '../redux/raps';
import { CDAI_CONTRACT, DAI_ADDRESS } from '../references';
import { createNewAction, createNewRap, RapActionTypes } from './common';

const createSwapAndDepositCompoundRap = ({
  inputCurrency,
  outputCurrency, // DAI
  inputAmount,
  outputAmount,
  selectedGasPrice,
  callback,
}) => {
  const isInputDAI = toLower(inputCurrency.address) === toLower(DAI_ADDRESS);
  console.log('[swap and deposit] currencies', inputCurrency, outputCurrency);
  console.log('[swap and deposit] amounts', inputAmount, outputAmount);
  let actions = [];
  if (!isInputDAI) {
    console.log('[swap and deposit] inputCurr is not DAI');
    // create unlock for swap rap
    const unlock = createNewAction(RapActionTypes.unlock, {
      assetToUnlock: inputCurrency,
      contractAddress: inputCurrency.exchangeAddress,
    });
    actions = concat(actions, unlock);
    console.log('[swap and deposit] making unlock for swap func');

    // create a swap rap
    const swap = createNewAction(RapActionTypes.swap, {
      inputAmount,
      inputAsExactAmount: false,
      inputCurrency,
      outputAmount,
      outputCurrency,
      selectedGasPrice,
    });
    actions = concat(actions, swap);
    console.log('[swap and deposit] making swap func');
  }

  // create unlock DAI on Compound rap
  console.log('[swap and deposit] making unlock DAI func');
  const unlockDAI = createNewAction(RapActionTypes.unlock, {
    assetToUnlock: isInputDAI ? inputCurrency : outputCurrency,
    contractAddress: CDAI_CONTRACT,
  });
  actions = concat(actions, unlockDAI);

  console.log('[swap and deposit] making deposit func');
  // create a deposit rap
  const deposit = createNewAction(RapActionTypes.depositCompound, {
    inputAmount: isInputDAI ? inputAmount : outputAmount,
    inputCurrency: isInputDAI ? inputCurrency : outputCurrency,
    selectedGasPrice,
  });
  actions = concat(actions, deposit);

  // create the overall rap
  const newRap = createNewRap(actions, callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  console.log('[swap and deposit] new rap!', newRap);
  return newRap;
};

export default createSwapAndDepositCompoundRap;
