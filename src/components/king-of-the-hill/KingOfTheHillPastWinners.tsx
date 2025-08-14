import { CHEVRON_RIGHT_SYMBOL } from '@/components/king-of-the-hill/constants';
import { Box, Inline, Text } from '@/design-system';
import React from 'react';
import { View } from 'react-native';

// Note: this is disabled at the moment pending backend data update

export const KingOfTheHillPastWinners = () => {
  // const { kingOfTheHill, kingOfTheHillLeaderBoard } = useKingOfTheHillStore(store => store.getData()) || {};

  return (
    <View style={{ padding: 20 }}>
      <Box backgroundColor="rgba(255,255,255,0.2)" borderRadius={20} padding="20px" borderWidth={2} borderColor="separator">
        <Inline alignVertical="center" space="6px">
          <Text size="20pt" color="label" weight="heavy">
            Past Winners
          </Text>
          <Text size="12pt" color="labelQuaternary" weight="bold">
            {CHEVRON_RIGHT_SYMBOL}
          </Text>
        </Inline>
      </Box>
    </View>
  );
};
