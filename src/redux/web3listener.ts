import { debounce, isEmpty } from 'lodash';
import { ThunkDispatch } from 'redux-thunk';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { multicallUpdateOutdatedListeners } from '@rainbow-me/redux/multicall';
import store, { AppGetState, AppState } from '@rainbow-me/redux/store';
import logger from 'logger';

// -- Actions ---------------------------------------- //
const updateMulticall = (blockNumber: number) => async (
  dispatch: ThunkDispatch<AppState, unknown, never>,
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

export const web3ListenerInit = (): void => {
  if (!web3Provider) {
    return;
  }

  web3Provider.pollingInterval = 10000;
  web3Provider.on('block', debouncedUpdateMulticallListeners);
};

export const web3ListenerStop = (): void => {
  web3Provider?.removeAllListeners('block');
};
