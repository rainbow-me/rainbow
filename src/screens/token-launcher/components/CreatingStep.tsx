import React from 'react';
import { Box, Text } from '@/design-system';
// import Animated from 'react-native-reanimated';
import { CreatingAnimatedTokenLogo } from './CreatingAnimatedTokenLogo';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';

export function CreatingStep() {
  const symbol = useTokenLauncherStore(state => state.symbol);

  return (
    <Box style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Box gap={16} alignItems="center">
        {/* <Animated.View sharedTransitionTag="tokenImage"> */}
        <CreatingAnimatedTokenLogo />
        {/* </Animated.View> */}
        <Text size="20pt" weight="bold" color={'labelSecondary'}>
          {`Deploying $${symbol}...`}
        </Text>
      </Box>
    </Box>
  );
}
