import React from 'react';

import { Inline } from '@/design-system';
import { useAccountAddress, useIsReadOnlyWallet } from '@/state/wallets/walletsStore';

import { useEnsPermissionsStore } from '../../../data/stores/ownershipStores';
import { EditButton } from './EditButton';
import { MoreButton } from './MoreButton';
import { SendButton } from './SendButton';
import { WatchButton } from './WatchButton';

export function ActionButtons({
  address: primaryAddress,
  ensName,
  avatarUrl,
}: {
  address?: string;
  ensName?: string;
  avatarUrl?: string | null;
}) {
  const account = useAccountAddress();
  const isReadOnlyWallet = useIsReadOnlyWallet();

  const canEditRecords = useEnsPermissionsStore(s =>
    ensName && account && !isReadOnlyWallet ? s.get({ name: ensName, account })?.canEditRecords : false
  );

  return (
    <Inline alignHorizontal="right" space="8px">
      <MoreButton address={primaryAddress} ensName={ensName} />
      {canEditRecords ? (
        <EditButton ensName={ensName} />
      ) : (
        <>
          <WatchButton address={primaryAddress} avatarUrl={avatarUrl} ensName={ensName} />
          {!isReadOnlyWallet && <SendButton ensName={ensName} />}
        </>
      )}
    </Inline>
  );
}
