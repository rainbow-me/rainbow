import { concat } from 'lodash';
import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import { savingsAssetsListByUnderlying } from '../references';
import { createNewAction, createNewRap, RapActionTypes } from './common';

const createSwapAndDepositCompoundRap = ({
  inputCurrency,
  outputCurrency,
  inputAmount,
  outputAmount,
  selectedGasPrice,
  callback,
}) => {
  const { network } = store.getState().settings;
  const requiresSwap = !!outputCurrency;
  console.log('[swap and deposit] currencies', inputCurrency, outputCurrency);
  console.log('[swap and deposit] amounts', inputAmount, outputAmount);
  let actions = [];
  if (requiresSwap) {
    console.log(
      '[swap and deposit] inputCurr is not the same as the output currency'
    );
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

  const tokenToDeposit = requiresSwap ? outputCurrency : inputCurrency;
  const cTokenContract =
    savingsAssetsListByUnderlying[network][tokenToDeposit.address]
      .contractAddress;
  console.log('ctokencontract', cTokenContract);

  // create unlock token on Compound rap
  console.log('[swap and deposit] making unlock token func');
  const unlockTokenToDeposit = createNewAction(RapActionTypes.unlock, {
    assetToUnlock: tokenToDeposit,
    contractAddress: cTokenContract,
  });
  actions = concat(actions, unlockTokenToDeposit);

  // create a deposit rap
  console.log('[swap and deposit] making deposit func');
  const deposit = createNewAction(RapActionTypes.depositCompound, {
    inputAmount: requiresSwap ? outputAmount : inputAmount,
    inputCurrency: tokenToDeposit,
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
