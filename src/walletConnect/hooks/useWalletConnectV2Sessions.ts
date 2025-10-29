import { useEffect, useCallback, useState } from 'react';

import { getAllActiveSessionsSync } from '@/walletConnect';
import { events } from '@/handlers/appEvents';

/**
 * Stateful hook that returns a list of all sessions, as well as a `reload`
 * method to refresh the list on demand.
 */
export function useWalletConnectV2Sessions() {
  const [sessions, setSessions] = useState<ReturnType<typeof getAllActiveSessionsSync>>(getAllActiveSessionsSync());

  /**
   * Synchronously refreshes the list of active sessions, pulled directly from
   * the WC v2 client.
   */
  const reload = useCallback(() => {
    setSessions(getAllActiveSessionsSync());
  }, [setSessions]);

  useEffect(() => {
    const unsubscribeWalletConnectV2SessionCreated = events.on('walletConnectV2SessionCreated', reload);
    const unsubscribeWalletConnectV2SessionDeleted = events.on('walletConnectV2SessionDeleted', reload);
    return () => {
      unsubscribeWalletConnectV2SessionCreated();
      unsubscribeWalletConnectV2SessionDeleted();
    };
  }, [reload]);

  return {
    sessions,
    reload,
  };
}
