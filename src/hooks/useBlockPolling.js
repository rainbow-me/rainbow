import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { web3ListenerInit, web3ListenerStop } from '../redux/web3listener';

export default function useBlockPolling() {
  const dispatch = useDispatch();

  const initWeb3Listener = useCallback(() => dispatch(web3ListenerInit()), [
    dispatch,
  ]);

  const stopWeb3Listener = useCallback(() => dispatch(web3ListenerStop()), [
    dispatch,
  ]);

  return {
    initWeb3Listener,
    stopWeb3Listener,
  };
}
