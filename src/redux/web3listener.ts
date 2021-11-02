import { JsonRpcProvider } from '@ethersproject/providers';
import { debounce, isEmpty } from 'lodash';
import { web3Provider } from '../handlers/web3';
import store, { AppDispatch, AppGetState } from '../redux/store';
import { multicallUpdateOutdatedListeners } from './multicall';
import logger from 'logger';

// -- Actions ---------------------------------------- //
const updateMulticall = (blockNumber: number) => async (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
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

const debouncedUpdateMulticallListeners = debounce(blockNumber => {
  store.dispatch(updateMulticall(blockNumber));
}, 1000);

let typedWeb3Provider = web3Provider as JsonRpcProvider | null;

export const web3ListenerInit = (): void => {
  if (!typedWeb3Provider) {
    return;
  }

  typedWeb3Provider.pollingInterval = 10000;
  typedWeb3Provider.on('block', debouncedUpdateMulticallListeners);
};

export const web3ListenerStop = (): void => {
  typedWeb3Provider?.removeAllListeners('block');
};
