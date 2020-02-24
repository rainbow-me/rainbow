import store from '../redux/store';
import { rapsAddOrUpdate } from '../redux/raps';
import { CDAI_CONTRACT } from '../references';
import { createNewAction, createNewRap, RapActionTypes } from './common';

const createSwapAndDepositCompoundRap = ({
  inputCurrency,
  outputCurrency, // DAI
  inputAmount,
  outputAmount,
  selectedGasPrice,
  inputAsExactAmount,
  callback,
}) => {
  console.log('[swap and deposit] currencies', inputCurrency, outputCurrency);
  console.log('[swap and deposit] amounts', inputAmount, outputAmount);
  console.log('[swap and deposit] input as exact amount', inputAsExactAmount);
  const actions = [];
  if (inputCurrency.address !== outputCurrency.address) {
    console.log('[swap and deposit] inputCurr != outputCurr');
    // create unlock for swap rap
    const unlock = createNewAction(RapActionTypes.unlock, {
      assetToUnlock: inputCurrency,
      contractAddress: inputCurrency.exchangeAddress,
    });
    actions.append(unlock);
    console.log('[swap and deposit] making unlock for swap func');

    // create a swap rap
    const swap = createNewAction(RapActionTypes.swap, {
      inputAmount,
      inputAsExactAmount,
      inputCurrency,
      outputAmount,
      outputCurrency,
      selectedGasPrice,
    });
    actions.append(swap);
    console.log('[swap and deposit] making swap func');
  }

  // create unlock DAI on Compound rap
  console.log('[swap and deposit] making unlock DAI func');
  const unlockDAI = createNewAction(RapActionTypes.unlock, {
    assetToUnlock: outputCurrency,
    contractAddress: CDAI_CONTRACT,
  });
  actions.append(unlockDAI);

  console.log('[swap and deposit] making deposit func');
  // create a deposit rap
  const deposit = createNewAction(RapActionTypes.depositCompound, {
    inputAmount: outputAmount,
    inputCurrency: outputCurrency,
    selectedGasPrice,
  });
  actions.append(deposit);

  // create the overall rap
  const newRap = createNewRap(actions, callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  console.log('[swap and deposit] new rap!', newRap);
  return newRap;
};

export default createSwapAndDepositCompoundRap;
