import React, { memo, useMemo } from 'react';

import { type SharedValue } from 'react-native-reanimated';

import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { TAB_BAR_ICON_SIZE } from '@/components/tab-bar/dimensions';
import { TabBarIcon } from '@/components/tab-bar/TabBarIcon';
import { Box, Cover, Text } from '@/design-system';
import { type TextSize } from '@/design-system/components/Text/Text';
import { IS_TEST } from '@/env';
import usePendingTransactions from '@/hooks/usePendingTransactions';

export const ActivityTabIcon = memo(function ActivityTabIcon({
  accentColor,
  index,
  reanimatedPosition,
  tabBarIcon,
}: {
  accentColor: string;
  index: number;
  reanimatedPosition: SharedValue<number>;
  tabBarIcon: string;
}) {
  const { pendingTransactions } = usePendingTransactions();

  const pendingCount = pendingTransactions.length;

  const textSize: TextSize = useMemo(() => {
    if (pendingCount < 10) {
      return '15pt';
    } else if (pendingCount < 20) {
      return '12pt';
    } else {
      return '11pt';
    }
  }, [pendingCount]);

  return pendingCount > 0 && !IS_TEST ? (
    <Box
      testID="transactions-pending-tab-icon"
      width={{ custom: TAB_BAR_ICON_SIZE }}
      height={{ custom: TAB_BAR_ICON_SIZE }}
      alignItems="center"
      justifyContent="center"
    >
      <AnimatedSpinner color={accentColor} isLoading requireSrc={require('@/assets/tabSpinner.png')} size={TAB_BAR_ICON_SIZE} />
      <Cover>
        <Box width="full" height="full" alignItems="center" justifyContent="center">
          <Text color={{ custom: accentColor }} size={textSize} weight="heavy" align="center">
            {pendingCount}
          </Text>
        </Box>
      </Cover>
    </Box>
  ) : (
    <TabBarIcon accentColor={accentColor} icon={tabBarIcon} index={index} reanimatedPosition={reanimatedPosition} />
  );
});
