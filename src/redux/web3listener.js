import { web3Provider } from '../handlers/web3';
// import logger from 'logger';

// -- Actions ---------------------------------------- //

export const web3ListenerInit = () => {
  web3Provider.pollingInterval = 10000;
  // web3Provider.on('block', block => {
  //   logger.debug('new block', block);
  // });
};

export const web3ListenerStop = () => {
  web3Provider.removeAllListeners('block');
};
