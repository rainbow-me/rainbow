import lang from 'i18n-js';
import React from 'react';
import ActionButton from './ActionButton';
import { useWatchWallet } from '@rainbow-me/hooks';

export default function WatchButton({
  address,
  ensName,
  avatarUrl,
}: {
  address?: string;
  ensName?: string;
  avatarUrl?: string | null;
}) {
  const { isWatching, watchWallet } = useWatchWallet({
    address,
    avatarUrl,
    ensName,
  });

  return (
    <ActionButton
      color="action"
      isWatching={isWatching}
      onPress={watchWallet}
      variant={!isWatching ? 'solid' : 'outlined'}
    >
      {lang.t(`profiles.actions.${isWatching ? 'watching' : 'watch'}`)}
    </ActionButton>
  );
}
