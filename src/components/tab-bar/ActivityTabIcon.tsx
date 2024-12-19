import { TabBarIcon } from '@/components/tab-bar/TabBarIcon';
import { TAB_BAR_ICON_SIZE } from '@/components/tab-bar/dimensions';
import { Box, Text, Cover } from '@/design-system';
import { usePendingTransactions } from '@/hooks';
import React, { memo, useMemo } from 'react';
import { SharedValue } from 'react-native-reanimated';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { TextSize } from '@/design-system/components/Text/Text';

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

  return pendingCount > 0 ? (
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
