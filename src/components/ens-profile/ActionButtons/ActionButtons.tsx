import React, { useMemo } from 'react';
import EditButton from './EditButton';
import MoreButton from './MoreButton';
import SendButton from './SendButton';
import WatchButton from './WatchButton';
import { Inline } from '@/design-system';
import { useWallets } from '@/hooks';

export default function ActionButtons({
  address: primaryAddress,
  ensName,
  avatarUrl,
}: {
  address?: string;
  ensName?: string;
  avatarUrl?: string | null;
}) {
  const { wallets, isReadOnlyWallet } = useWallets();

  const isOwner = useMemo(() => {
    return Object.values(wallets || {}).some(
      (wallet: any) => wallet.type !== 'readOnly' && wallet.addresses.some(({ address }: any) => address === primaryAddress)
    );
  }, [primaryAddress, wallets]);

  return (
    <Inline alignHorizontal="right" space="8px">
      <MoreButton address={primaryAddress} ensName={ensName} />
      {isOwner ? (
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
