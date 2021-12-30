import { web3Provider } from '@rainbow-me/handlers/web3';

// -- Actions ---------------------------------------- //

export const web3ListenerInit = (): void => {
  if (!web3Provider) {
    return;
  }

  web3Provider.pollingInterval = 10000;
  // web3Provider.on('block', block => {
  //   logger.debug('new block', block);
  // });
};

export const web3ListenerStop = (): void => {
  web3Provider?.removeAllListeners('block');
};
