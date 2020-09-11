import { useCallback } from 'react';
import { web3ListenerInit, web3ListenerStop } from '../redux/web3listener';

export default function useBlockPolling() {
  const initWeb3Listener = useCallback(() => web3ListenerInit(), []);

  const stopWeb3Listener = useCallback(() => web3ListenerStop(), []);

  return {
    initWeb3Listener,
    stopWeb3Listener,
  };
}
