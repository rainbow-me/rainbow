/* eslint-disable react/jsx-props-no-spreading */
import React, { PropsWithChildren } from 'react';
import {
  ContextMenuButton,
  ContextMenuButtonProps,
  DynamicColor,
  MenuAttributes,
  MenuElementSize,
  MenuState,
  UIMenuOptions,
} from 'react-native-ios-context-menu';

/**
 * This components was widely used throughout the app but without types (.js file all as any)
 * even tho it works fine, transitioning to typescript makes a lot scream
 * so I recreate the 'react-native-ios-context-menu' types here in a less strict way
 * just to not have to deal with the strictness of the original types
 */

// eslint-disable-next-line @typescript-eslint/ban-types
type IconConfig = { iconType: 'ASSET' | 'SYSTEM' | (string & {}); iconValue: string; iconTint?: string | DynamicColor };

export type MenuActionConfig = Readonly<
  {
    actionSubtitle?: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    menuState?: MenuState | (string & {});
    menuAttributes?: Array<MenuAttributes>;
    discoverabilityTitle?: string;
    icon?: IconConfig;
  } & (
    | { menuTitle: string; menuItems: Readonly<Array<MenuActionConfig>>; actionKey?: never; actionTitle?: never }
    | { menuTitle?: never; menuItems?: never; actionKey: string; actionTitle: string }
  )
>;

export type MenuConfig = Readonly<{
  menuTitle?: string;
  menuItems: Readonly<Array<MenuActionConfig>>;
  menuSubtitle?: string;
  menuOptions?: Array<UIMenuOptions>;
  menuPreferredElementSize?: MenuElementSize;
  icon?: IconConfig;
}>;

export default function ContextMenu(
  props: PropsWithChildren<
    Omit<ContextMenuButtonProps, 'menuConfig' | 'onPressMenuItem'> & {
      menuConfig: MenuConfig;
      onPressMenuItem: (e: { nativeEvent: Omit<MenuActionConfig, 'actionKey'> & { actionKey: any } }) => void;
      isAnchoredToRight?: boolean; // this only used in android check contextMenu.android.tsx in this same folder
    }
  >
) {
  // @ts-expect-error `activeOpacity` and `wrapNativeComponent` are missing in the `ContextMenuButtonProps` type but are valid
  // https://www.npmjs.com/package/react-native-ios-context-menu/v/1.2.1#312-contextmenubutton-component
  return <ContextMenuButton activeOpacity={0} isMenuPrimaryAction useActionSheetFallback={false} wrapNativeComponent={false} {...props} />;
}
