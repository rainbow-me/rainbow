import React from 'react';

import { getAllActiveSessionsSync } from '@/walletConnect';
import { events } from '@/handlers/appEvents';

/**
 * Stateful hook that returns a list of all sessions, as well as a `reload`
 * method to refresh the list on demand.
 */
export function useWalletConnectV2Sessions() {
  const [sessions, setSessions] = React.useState<ReturnType<typeof getAllActiveSessionsSync>>(getAllActiveSessionsSync());

  /**
   * Synchronously refreshes the list of active sessions, pulled directly from
   * the WC v2 client.
   */
  const reload = React.useCallback(() => {
    setSessions(getAllActiveSessionsSync());
  }, [setSessions]);

  React.useEffect(() => {
    const one = events.on('walletConnectV2SessionCreated', reload);
    const two = events.on('walletConnectV2SessionDeleted', reload);
    return () => {
      one();
      two();
    };
  }, [setSessions]);

  return {
    sessions,
    reload,
  };
}
