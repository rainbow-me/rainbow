import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { Box, Space, globalColors, useBackgroundColor } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useTheme } from '@/theme';

type Props = {
  paddingVertical?: Space;
  paddingHorizontal?: Space;
};

export function RewardsSectionCard({ children, paddingVertical = '20px', paddingHorizontal = '20px' }: PropsWithChildren<Props>) {
  const { isDarkMode } = useTheme();

  const bg = useBackgroundColor('surfaceSecondaryElevated');

  return (
    <View
      style={
        IS_IOS
          ? {
              shadowColor: globalColors.grey100,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 3,
            }
          : {}
      }
    >
      <View
        style={
          IS_IOS
            ? {
                shadowColor: globalColors.grey100,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDarkMode ? 0.24 : 0.08,
                shadowRadius: 6,
              }
            : {
                shadowColor: globalColors.grey100,
                elevation: 8,
                shadowOpacity: isDarkMode ? 1 : 0.55,
                backgroundColor: bg,
                borderRadius: 18,
              }
        }
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
