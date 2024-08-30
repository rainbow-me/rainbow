/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { ContextMenuButton, ContextMenuButtonProps } from 'react-native-ios-context-menu';

export default function ContextMenu(props: ContextMenuButtonProps) {
  return (
    <ContextMenuButton
      isMenuPrimaryAction
      useActionSheetFallback={false}
      // @ts-ignore
      activeOpacity={0}
      // @ts-ignore
      wrapNativeComponent={false}
      {...props}
    />
  );
}
