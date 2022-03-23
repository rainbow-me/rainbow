import React from 'react';
import GradientOutlineButton from '../GradientOutlineButton/GradientOutlineButton';
import { useTheme } from '@rainbow-me/context';
import { ColorModeProvider } from '@rainbow-me/design-system';
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
  const { colors } = useTheme();

  const { isWatching, watchWallet } = useWatchWallet({
    address,
    avatarUrl,
    ensName,
  });

  return (
    <ColorModeProvider value="darkTinted">
      <GradientOutlineButton
        gradient={colors.gradients.blueToGreen}
        onPress={watchWallet}
      >
        􀨭 {isWatching ? 'Watching' : 'Watch'}
      </GradientOutlineButton>
    </ColorModeProvider>
  );
}
