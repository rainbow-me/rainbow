import React, { type ReactNode } from 'react';
import { Platform } from 'react-native';

import { ContextMenu } from '@/components/context-menu';
import { Centered } from '@/components/layout';
import ContextMenuButton, { type MenuConfig } from '@/components/native-context-menu/contextMenu';

type GasSpeedMenuProps = {
  children: ReactNode;
  menuConfig: MenuConfig;
  onPressActionSheet: (buttonIndex: number) => void;
  onPressMenuItem: (event: { nativeEvent: { actionKey: any } }) => void;
  options: string[];
};

export const GasSpeedMenu = ({ children, menuConfig, onPressActionSheet, onPressMenuItem, options }: GasSpeedMenuProps) => {
  if (Platform.OS === 'android') {
    return (
      <ContextMenu
        activeOpacity={0}
        enableContextMenu
        isAnchoredToRight
        isMenuPrimaryAction
        onPressActionSheet={onPressActionSheet}
        options={options}
        useActionSheetFallback={false}
        wrapNativeComponent={false}
      >
        <Centered>{children}</Centered>
      </ContextMenu>
    );
  }
  return (
    <ContextMenuButton
      enableContextMenu
      isMenuPrimaryAction
      menuConfig={menuConfig}
      onPressMenuItem={onPressMenuItem}
      useActionSheetFallback={false}
    >
      {children}
    </ContextMenuButton>
  );
};
