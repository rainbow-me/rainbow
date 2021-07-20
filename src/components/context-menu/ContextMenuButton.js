import React from 'react';

import { ContextMenuButton as IOSContextMenuButton } from 'react-native-ios-context-menu';
import ButtonPressAnimation from '../../components/animations/ButtonPressAnimation';

export default function ContextMenuButton({
  children,
  menuItems,
  menuTitle,
  onPressAndroid,
  onPressMenuItem,
}) {
  return (
    <IOSContextMenuButton
      activeOpacity={0}
      isMenuPrimaryAction
      {...(android ? { onPress: onPressAndroid } : {})}
      menuConfig={{
        menuItems,
        menuTitle,
      }}
      onPressMenuItem={onPressMenuItem}
      useActionSheetFallback={false}
      wrapNativeComponent={false}
    >
      <ButtonPressAnimation>{children}</ButtonPressAnimation>
    </IOSContextMenuButton>
  );
}
