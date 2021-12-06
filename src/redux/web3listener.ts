import { debounce, isEmpty } from 'lodash';
import { web3Provider } from '../handlers/web3';
import store from '../redux/store';
import { multicallUpdateOutdatedListeners } from './multicall';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

// -- Actions ---------------------------------------- //
const updateMulticall = (blockNumber: any) => async (
  dispatch: any,
  getState: any
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

export const web3ListenerInit = () => {
  web3Provider.pollingInterval = 10000;
  web3Provider.on('block', debouncedUpdateMulticallListeners);
};

export const web3ListenerStop = () => {
  web3Provider.removeAllListeners('block');
};
