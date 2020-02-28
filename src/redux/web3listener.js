import { get } from 'lodash';
import { getReserve } from '../handlers/uniswap';
import { web3Provider } from '../handlers/web3';
import { promiseUtils } from '../utils';
import { uniswapUpdateTokenReserves } from './uniswap';

// -- Actions ---------------------------------------- //
const web3UpdateReserves = () => async (dispatch, getState) => {
  const { inputCurrency, outputCurrency } = getState().uniswap;

  if (!(inputCurrency || outputCurrency)) return;
  const [inputReserve, outputReserve] = await promiseUtils.PromiseAllWithFails([
    getReserve(get(inputCurrency, 'address')),
    getReserve(get(outputCurrency, 'address')),
  ]);

  dispatch(uniswapUpdateTokenReserves(inputReserve, outputReserve));
};

export const web3ListenerInit = () => dispatch => {
  web3Provider.pollingInterval = 10000;
  web3Provider.on('block', () => dispatch(web3UpdateReserves()));
};

export const web3ListenerStop = () => () => {
  web3Provider.removeAllListeners('block');
};
