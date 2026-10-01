import React from 'react';
import { Platform } from 'react-native';

import { ContextMenuButton as IOSContextMenuButton } from 'react-native-ios-context-menu';

import { ButtonPressAnimation } from '../animations/ButtonPressAnimation';

export default function ContextMenuButton({ children, hitSlop = 0, menuItems, menuTitle, onPressAndroid, onPressMenuItem, testID }) {
  const button = (
    <ButtonPressAnimation
      onPress={Platform.OS === 'android' ? onPressAndroid : undefined}
      style={{ padding: hitSlop }}
      wrapperStyle={Platform.OS === 'android' ? { margin: -hitSlop } : undefined}
      testID={testID}
    >
      {children}
    </ButtonPressAnimation>
  );

  if (Platform.OS === 'android') return button;

  return (
    <IOSContextMenuButton
      activeOpacity={0}
      isMenuPrimaryAction
      menuConfig={{
        menuItems,
        menuTitle,
      }}
      style={{ margin: -hitSlop }}
      onPressMenuItem={onPressMenuItem}
      useActionSheetFallback={false}
      wrapNativeComponent={false}
    >
      {button}
    </IOSContextMenuButton>
  );
}
