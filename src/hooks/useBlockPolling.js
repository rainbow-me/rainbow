import { web3ListenerInit, web3ListenerStop } from '../redux/web3listener';

export default function useBlockPolling() {
  return {
    web3ListenerInit,
    web3ListenerStop,
  };
}
