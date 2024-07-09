import React from 'react';
import { ContextMenuButton as IOSContextMenuButton } from 'react-native-ios-context-menu';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';

export default function ContextMenuButton({ children, hitSlop = 0, menuItems, menuTitle, onPressAndroid, onPressMenuItem, testID }) {
  return (
    <IOSContextMenuButton
      activeOpacity={0}
      isMenuPrimaryAction
      {...(android ? { onPress: onPressAndroid } : {})}
      menuConfig={{
        menuItems,
        menuTitle,
      }}
      style={{ margin: -hitSlop }}
      onPressMenuItem={onPressMenuItem}
      useActionSheetFallback={false}
      wrapNativeComponent={false}
    >
      <ButtonPressAnimation style={{ padding: hitSlop }} testID={testID}>
        {children}
      </ButtonPressAnimation>
    </IOSContextMenuButton>
  );
}
