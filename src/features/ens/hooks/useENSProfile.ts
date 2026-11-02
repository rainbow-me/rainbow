import { useAccountAddress, useWalletsStore } from '@/state/wallets/walletsStore';

import { useEnsOwnerStore, useEnsRegistrationMetadataStore } from '../data/stores/ownershipStores';
import { useEnsRecordsStore } from '../data/stores/recordsStore';

/**
 * Combines independently cached profile fields with the active wallet's permissions.
 */
export function useENSProfile(name: string, { enabled = true, supportedRecordsOnly = true } = {}) {
  const accountAddress = useAccountAddress();
  const primaryName = useWalletsStore(s => s.walletNames[accountAddress]);
  const active = enabled && !!name;
  const records = useEnsRecordsStore(s => (active ? s.get({ name, supportedOnly: supportedRecordsOnly }) : undefined));
  const hasRecordsOutcome = useEnsRecordsStore(s => active && s.hasSettled({ name, supportedOnly: supportedRecordsOnly }));
  const hasOwnerOutcome = useEnsOwnerStore(s => active && s.hasSettled(name));
  const hasRegistrationOutcome = useEnsRegistrationMetadataStore(s => active && s.hasSettled(name));
  const ownerAddress = useEnsOwnerStore(s => (active ? s.get(name) : undefined));
  const registration = useEnsRegistrationMetadataStore(s => (active ? s.get(name) : undefined));
  const registrantAddress = registration?.registrant?.id;

  return {
    data: {
      ...records,
      address: records?.coinAddresses.ETH,
      owner: ownerAddress && { address: ownerAddress },
      registrant: registration === undefined ? undefined : registrantAddress ? { address: registrantAddress } : null,
      registration,
    },
    hasTransferData: records !== undefined && ownerAddress !== undefined && registration !== undefined,
    hasRecordsOutcome,
    hasRegistrationOutcome,
    hasOwnershipOutcome: hasOwnerOutcome && hasRegistrationOutcome,
    isOwner: !!ownerAddress && ownerAddress.toLowerCase() === accountAddress.toLowerCase(),
    isRegistrant: !!registrantAddress && registrantAddress.toLowerCase() === accountAddress.toLowerCase(),
    isSetNameEnabled: records?.coinAddresses.ETH?.toLowerCase() === accountAddress.toLowerCase(),
    isPrimaryName: primaryName?.toLowerCase() === name.toLowerCase(),
  };
}
