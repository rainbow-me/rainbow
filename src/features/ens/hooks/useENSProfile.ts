import { getAddress } from 'viem';

import { useAccountAddress, useWalletsStore } from '@/state/wallets/walletsStore';

import { useEnsImageStore } from '../data/stores/imageStore';
import { useEnsOwnerStore, useEnsRegistrationMetadataStore } from '../data/stores/ownershipStores';
import { useEnsRecordsStore } from '../data/stores/recordsStore';
import { useEnsNameStore } from '../data/useEnsNameStore';

/**
 * Combines independently cached profile fields with the active wallet's permissions.
 */
export default function useENSProfile(name: string, { enabled = true, supportedRecordsOnly = true } = {}) {
  const accountAddress = useAccountAddress();
  const primaryName = useWalletsStore(s => s.walletNames[accountAddress]);
  const active = enabled && !!name;
  const records = useEnsRecordsStore(s => (active ? s.get({ name, supportedOnly: supportedRecordsOnly }) : undefined));
  const hasRecordsOutcome = useEnsRecordsStore(s => active && s.hasSettled({ name, supportedOnly: supportedRecordsOnly }));
  const hasOwnerOutcome = useEnsOwnerStore(s => active && s.hasSettled(name));
  const hasRegistrationOutcome = useEnsRegistrationMetadataStore(s => active && s.hasSettled(name));
  const ownerAddress = useEnsOwnerStore(s => (active ? s.get(name) : undefined));
  const registration = useEnsRegistrationMetadataStore(s => (active ? s.get(name) : undefined));
  const avatar = useEnsImageStore(s => (active ? s.get({ name, field: 'avatar' }) : undefined));
  const header = useEnsImageStore(s => (active ? s.get({ name, field: 'header' }) : undefined));
  const registrantAddress = registration?.registrant?.id;
  const ownerName = useEnsNameStore(s => (ownerAddress ? s.get(ownerAddress) : undefined));
  const registrantName = useEnsNameStore(s => (registrantAddress ? s.get(getAddress(registrantAddress)) : undefined));

  return {
    data: {
      ...records,
      address: records?.coinAddresses.ETH,
      images: { avatar: { imageUrl: avatar }, header: { imageUrl: header } },
      owner: ownerAddress && { address: ownerAddress, name: ownerName },
      registrant: registration === undefined ? undefined : registrantAddress ? { address: registrantAddress, name: registrantName } : null,
      registration,
    },
    hasTransferData: records !== undefined && ownerAddress !== undefined && registration !== undefined,
    hasRecordsOutcome,
    hasOwnershipOutcome: hasOwnerOutcome && hasRegistrationOutcome,
    isOwner: !!ownerAddress && ownerAddress.toLowerCase() === accountAddress.toLowerCase(),
    isRegistrant: !!registrantAddress && registrantAddress.toLowerCase() === accountAddress.toLowerCase(),
    isSetNameEnabled: records?.coinAddresses.ETH?.toLowerCase() === accountAddress.toLowerCase(),
    isPrimaryName: primaryName?.toLowerCase() === name.toLowerCase(),
  };
}
