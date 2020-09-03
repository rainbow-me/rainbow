import { isEmpty, throttle } from 'lodash';
import { web3Provider } from '../handlers/web3';
import store from '../redux/store';
import { multicallUpdateOutdatedListeners } from './multicall';
import logger from 'logger';

// -- Actions ---------------------------------------- //
const updateMulticall = blockNumber => async (dispatch, getState) => {
  const { listeners } = getState().multicall;
  try {
    if (isEmpty(listeners)) return;
    dispatch(multicallUpdateOutdatedListeners(blockNumber));
  } catch (error) {
    logger.log(
      '[web3 listener] - Error updating Uniswap V2 token reserves',
      error
    );
  }
};

const debouncedUpdateMulticallListeners = blockNumber =>
  throttle(store.dispatch(updateMulticall(blockNumber)), 8000);

export const web3ListenerInit = () => () => {
  web3Provider.pollingInterval = 10000;
  web3Provider.on('block', blockNumber =>
    debouncedUpdateMulticallListeners(blockNumber)
  );
};

export const web3ListenerStop = () => () => {
  web3Provider.removeAllListeners('block');
};
