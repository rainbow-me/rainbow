import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import { createNewAction, createNewRap, RapActionTypes } from './common';

const createWithdrawFromCompoundRap = ({
  inputCurrency,
  inputAmount,
  selectedGasPrice,
  callback,
}) => {
  console.log('[withdraw rap] withdraw', inputCurrency);

  // create a withdraw rap
  console.log('[withdraw rap] making redeem func');
  const withdraw = createNewAction(RapActionTypes.withdrawCompound, {
    inputAmount,
    inputCurrency,
    selectedGasPrice,
  });
  const actions = [withdraw];

  // create the overall rap
  const newRap = createNewRap(actions, callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  console.log('[withdraw rap] new rap!', newRap);
  return newRap;
};

export default createWithdrawFromCompoundRap;
