import React from 'react';
import { ContextMenuButton } from 'react-native-ios-context-menu';

export default function ContextMenu(props) {
  return <ContextMenuButton activeOpacity={0} isMenuPrimaryAction useActionSheetFallback={false} wrapNativeComponent={false} {...props} />;
}
