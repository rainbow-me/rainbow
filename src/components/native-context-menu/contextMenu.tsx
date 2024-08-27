/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { ContextMenuButton, ContextMenuButtonProps } from 'react-native-ios-context-menu';

export default function ContextMenu(props: ContextMenuButtonProps) {
  return <ContextMenuButton activeOpacity={0} isMenuPrimaryAction useActionSheetFallback={false} wrapNativeComponent={false} {...props} />;
}
