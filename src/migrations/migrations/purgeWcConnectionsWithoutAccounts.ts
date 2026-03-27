import { disconnectSession, getAllActiveSessions } from '@/features/wallet-connect/services/sessions';
import { type Migration, MigrationName } from '../types';

export function purgeWcConnectionsWithoutAccounts(): Migration {
  return {
    name: MigrationName.purgeWcConnectionsWithoutAccounts,
    async defer() {
      const walletConnectV2Sessions = await getAllActiveSessions();
      await Promise.all(
        walletConnectV2Sessions.map(session => {
          if (!session.namespaces.eip155.accounts.length) {
            disconnectSession(session);
          }
          return Promise.resolve();
        })
      );
    },
  };
}
