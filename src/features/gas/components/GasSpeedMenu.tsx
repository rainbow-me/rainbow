import React, { type ReactNode } from 'react';

import { ContextMenu } from '@/components/context-menu';
import { Centered } from '@/components/layout';
import ContextMenuButton, { type MenuConfig } from '@/components/native-context-menu/contextMenu';
import { IS_ANDROID } from '@/env';

type GasSpeedMenuProps = {
  children: ReactNode;
  menuConfig: MenuConfig;
  onPressActionSheet: (buttonIndex: number) => void;
  onPressMenuItem: (event: { nativeEvent: { actionKey: any } }) => void;
  options: string[];
};

export const GasSpeedMenu = ({ children, menuConfig, onPressActionSheet, onPressMenuItem, options }: GasSpeedMenuProps) => {
  if (IS_ANDROID) {
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
