import { useAccountAddress, useWalletsStore } from '@/state/wallets/walletsStore';

import { useEnsOwnerStore, useEnsRegistrationMetadataStore } from '../data/stores/ownershipStores';
import { useEnsRecordsStore } from '../data/stores/recordsStore';

/**
 * Combines independently cached profile fields with the active wallet's permissions.
 */
export function useENSProfile(name: string, { supportedRecordsOnly = true } = {}) {
  const profileName = name || undefined;
  const recordsInput = profileName ? { name: profileName, supportedOnly: supportedRecordsOnly } : undefined;

  const accountAddress = useAccountAddress();
  const primaryName = useWalletsStore(s => s.walletNames[accountAddress]);

  const records = useEnsRecordsStore(s => s.get(recordsInput));
  const hasRecordsOutcome = useEnsRecordsStore(s => s.hasSettled(recordsInput));

  const ownerAddress = useEnsOwnerStore(s => s.get(profileName));
  const hasOwnerOutcome = useEnsOwnerStore(s => s.hasSettled(profileName));

  const registration = useEnsRegistrationMetadataStore(s => s.get(profileName));
  const hasRegistrationOutcome = useEnsRegistrationMetadataStore(s => s.hasSettled(profileName));

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
