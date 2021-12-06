import { useCallback } from 'react';
import {
  web3ListenerInit,
  web3ListenerStop,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/web3listener... Remove this comment to see the full error message
} from '@rainbow-me/redux/web3listener';

export default function useBlockPolling() {
  const initWeb3Listener = useCallback(() => web3ListenerInit(), []);
  const stopWeb3Listener = useCallback(() => web3ListenerStop(), []);

  return {
    initWeb3Listener,
    stopWeb3Listener,
  };
}
