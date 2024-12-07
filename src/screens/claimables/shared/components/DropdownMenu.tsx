import { Bleed, Box, Text, useColorMode } from '@/design-system';
import React from 'react';
import { View } from 'react-native';
import { ContextMenuButton } from '@/components/context-menu';
import { OnPressMenuItemEventObject } from 'react-native-ios-context-menu';

export function DropdownMenu({
  disabled,
  menuConfig,
  muted,
  onPressMenuItem,
  onShowActionSheet,
  text,
  icon,
}: {
  disabled: boolean;
  menuConfig: {
    menuItems: {
      actionKey: string;
      actionTitle: string;
      icon?: {
        iconType: string;
        iconValue: string;
      };
    }[];
  };
  muted: boolean;
  onPressMenuItem: ({ nativeEvent: { actionKey } }: Omit<OnPressMenuItemEventObject, 'isUsingActionSheetFallback'>) => void;
  onShowActionSheet: () => void;
  text: string;
  icon?: React.ReactNode; // must have size: 16
}) {
  const { isDarkMode } = useColorMode();

  return (
    <View style={{ pointerEvents: disabled ? 'none' : undefined }}>
      <ContextMenuButton
        hitSlop={20}
        menuItems={menuConfig.menuItems}
        menuTitle=""
        onPressMenuItem={onPressMenuItem}
        onPressAndroid={onShowActionSheet}
        testID={undefined}
      >
        <Box
          paddingHorizontal={{ custom: 7 }}
          height={{ custom: 28 }}
          flexDirection="row"
          borderColor={{ custom: isDarkMode ? 'rgba(245, 248, 255, 0.04)' : 'rgba(9, 17, 31, 0.02)' }}
          borderWidth={1.33}
          borderRadius={12}
          gap={4}
          style={{ backgroundColor: isDarkMode ? 'rgba(245, 248, 255, 0.04)' : 'rgba(9, 17, 31, 0.02)' }}
          alignItems="center"
          justifyContent="center"
        >
          {icon && <Bleed vertical="4px">{icon}</Bleed>}
          <Text align="center" weight="heavy" color={muted ? 'labelQuaternary' : 'label'} size="17pt">
            {text}
          </Text>
          <Text align="center" weight="heavy" color="labelSecondary" size="icon 12px">
            􀆏
          </Text>
        </Box>
      </ContextMenuButton>
    </View>
  );
}
