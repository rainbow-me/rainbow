import { useAccountAddress, useWalletsStore } from '@/state/wallets/walletsStore';

import { useEnsOwnershipStore } from '../data/stores/ownershipStores';
import { useEnsRecordsStore } from '../data/stores/recordsStore';

/**
 * Combines independently cached profile fields with the active wallet's permissions.
 */
export function useEnsTokenDetails(name: string) {
  const accountAddress = useAccountAddress();
  const primaryName = useWalletsStore(s => s.walletNames[accountAddress]);
  const profileName = name || undefined;
  const recordsInput = profileName ? { name: profileName } : undefined;

  const records = useEnsRecordsStore(s => s.get(recordsInput));
  const hasRecordsOutcome = useEnsRecordsStore(s => s.hasSettled(recordsInput));

  const ownership = useEnsOwnershipStore(s => s.get(profileName));
  const hasOwnershipOutcome = useEnsOwnershipStore(s => s.hasSettled(profileName));

  return {
    records,
    ownership,
    hasRecordsOutcome,
    hasOwnershipOutcome,
    isSetNameEnabled: records?.coinAddresses.ETH?.toLowerCase() === accountAddress.toLowerCase(),
    isPrimaryName: primaryName?.toLowerCase() === name.toLowerCase(),
  };
}
