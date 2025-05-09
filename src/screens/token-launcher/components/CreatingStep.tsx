import React from 'react';
import * as i18n from '@/languages';
import { Box, Text } from '@/design-system';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { RainbowTokenFlip } from './RainbowTokenFlip';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';

export function CreatingStep() {
  const { tokenImage, accentColors } = useTokenLauncherContext();
  const symbol = useTokenLauncherStore(state => state.symbol);

  if (!tokenImage) return null;

  return (
    <Box style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Box gap={32} alignItems="center">
        <RainbowTokenFlip color={accentColors.opacity100} image={tokenImage} size={100} />
        <Text size="20pt" weight="bold" color={'label'}>
          {i18n.t(i18n.l.token_launcher.creating.deploying, { symbol })}
        </Text>
      </Box>
    </Box>
  );
}
