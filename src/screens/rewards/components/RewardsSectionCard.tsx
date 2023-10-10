import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { Box, Space, globalColors } from '@/design-system';

type Props = {
  paddingVertical?: Space;
  paddingHorizontal?: Space;
};

export function RewardsSectionCard({
  children,
  paddingVertical = '20px',
  paddingHorizontal = '20px',
}: PropsWithChildren<Props>) {
  return (
    <View
      style={{
        shadowColor: globalColors.grey100,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 3,
      }}
    >
      <View
        style={{
          shadowColor: globalColors.grey100,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        }}
      >
        <Box
          background="surfaceSecondaryElevated"
          flexDirection="column"
          borderRadius={18}
          width="full"
          paddingVertical={paddingVertical}
          paddingHorizontal={paddingHorizontal}
        >
          {children}
        </Box>
      </View>
    </View>
  );
}
