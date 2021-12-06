import React from 'react';

// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { ContextMenuButton as IOSContextMenuButton } from 'react-native-ios-context-menu';
import ButtonPressAnimation from '../../components/animations/ButtonPressAnimation';

export default function ContextMenuButton({
  children,
  menuItems,
  menuTitle,
  onPressAndroid,
  onPressMenuItem,
}: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <IOSContextMenuButton
      activeOpacity={0}
      isMenuPrimaryAction
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {...(android ? { onPress: onPressAndroid } : {})}
      menuConfig={{
        menuItems,
        menuTitle,
      }}
      onPressMenuItem={onPressMenuItem}
      useActionSheetFallback={false}
      wrapNativeComponent={false}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation>{children}</ButtonPressAnimation>
    </IOSContextMenuButton>
  );
}
