import { get, throttle } from 'lodash';
import { getReserve } from '../handlers/uniswap';
import { web3Provider } from '../handlers/web3';
import store from '../redux/store';
import { uniswapUpdateTokenReserves } from './uniswap';
import logger from 'logger';

// -- Actions ---------------------------------------- //
const web3UpdateReserves = () => async (dispatch, getState) => {
  const { inputCurrency, outputCurrency } = getState().uniswap;

  if (!(inputCurrency || outputCurrency)) return;
  try {
    const [inputReserve, outputReserve] = await Promise.all([
      getReserve(get(inputCurrency, 'address')),
      getReserve(get(outputCurrency, 'address')),
    ]);

    dispatch(uniswapUpdateTokenReserves(inputReserve, outputReserve));
  } catch (error) {
    logger.log('Error updating Uniswap token reserves', error);
  }
};

const debouncedUpdateReserves = throttle(
  store.dispatch(web3UpdateReserves),
  8000
);

export const web3ListenerInit = () => () => {
  web3Provider.pollingInterval = 10000;
  web3Provider.on('block', debouncedUpdateReserves);
};

export const web3ListenerStop = () => () => {
  web3Provider.removeAllListeners('block');
};
