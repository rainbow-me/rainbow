import React, { useCallback } from 'react';
import * as DropdownMenuPrimitive from 'zeego/dropdown-menu';
import styled from 'styled-components';
import { IconConfig, MenuActionConfig, MenuConfig as _MenuConfig } from 'react-native-ios-context-menu';
import { ImageSystemSymbolConfiguration } from 'react-native-ios-context-menu/lib/typescript/types/ImageItemConfig';
import { ImageSourcePropType, ImageURISource } from 'react-native';
import type { SFSymbols5_0 } from 'sf-symbols-typescript';
import type { DropdownMenuContentProps } from '@radix-ui/react-dropdown-menu';
import { ButtonPressAnimation } from './animations';
import ConditionalWrap from 'conditional-wrap';

export const DropdownMenuRoot = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuContent = DropdownMenuPrimitive.Content;
export const DropdownMenuItem = DropdownMenuPrimitive.create(
  styled(DropdownMenuPrimitive.Item)({
    height: 34,
  }),
  'Item'
);
export const DropdownMenuCheckboxItem = DropdownMenuPrimitive.create(
  styled(DropdownMenuPrimitive.CheckboxItem)({
    height: 34,
  }),
  'CheckboxItem'
);
export const DropdownMenuItemTitle = DropdownMenuPrimitive.ItemTitle;
export const DropdownMenuItemIcon = DropdownMenuPrimitive.ItemIcon;
export const DropdownMenuItemImage = DropdownMenuPrimitive.ItemImage;

export type MenuItemSystemImage = {
  iconType: 'SYSTEM';
  iconValue: SFSymbols5_0;
} & ImageSystemSymbolConfiguration;

export type MenuItemAssetImage = {
  iconType: 'ASSET';
  iconValue: ImageSourcePropType;
};

export type MenuItemRemoteAssetImage = {
  iconType: 'REMOTE';
  iconValue: ImageURISource;
};

export type MenuItemIcon = Omit<IconConfig, 'iconValue' | 'iconType'> &
  (MenuItemSystemImage | MenuItemAssetImage | MenuItemRemoteAssetImage);

export type MenuItem<T> = Omit<MenuActionConfig, 'icon'> & {
  actionKey: T;
  actionTitle: string;
  destructive?: boolean;
  icon?: MenuItemIcon | { iconType: string; iconValue: string | ImageSourcePropType };
};

export type MenuConfig<T extends string> = Omit<_MenuConfig, 'menuItems' | 'menuTitle'> & {
  menuTitle?: string;
  menuItems: Array<MenuItem<T>>;
};

type DropdownMenuProps<T extends string> = {
  children: React.ReactElement;
  menuConfig: MenuConfig<T>;
  onPressMenuItem: (actionKey: T) => void;
  triggerAction?: 'press' | 'longPress';
  menuItemType?: 'checkbox';
  testID?: string;
} & DropdownMenuContentProps;

const buildIconConfig = (icon?: MenuItemIcon) => {
  if (!icon) return null;

  if (icon.iconType === 'SYSTEM') {
    const ios = { name: icon.iconValue };

    return <DropdownMenuItemIcon ios={ios} />;
  }

  if (icon.iconType === 'ASSET') {
    return <DropdownMenuItemImage source={icon.iconValue} />;
  }

  if (icon.iconType === 'REMOTE') {
    return <DropdownMenuItemImage source={icon.iconValue} />;
  }

  return null;
};

export function DropdownMenu<T extends string>({
  children,
  menuConfig,
  onPressMenuItem,
  loop = true,
  align = 'end',
  sideOffset = 8,
  side = 'right',
  alignOffset = 5,
  avoidCollisions = true,
  triggerAction = 'press',
  menuItemType,
  testID,
}: DropdownMenuProps<T>) {
  const handleSelectItem = useCallback(
    (actionKey: T) => {
      onPressMenuItem(actionKey);
    },
    [onPressMenuItem]
  );

  const MenuItemComponent = menuItemType === 'checkbox' ? DropdownMenuCheckboxItem : DropdownMenuItem;

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger action={triggerAction}>
        <ConditionalWrap
          condition={triggerAction === 'press'}
          wrap={children => <ButtonPressAnimation testID={testID}>{children}</ButtonPressAnimation>}
        >
          {children}
        </ConditionalWrap>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        loop={loop}
        side={side}
        align={align}
        alignOffset={alignOffset}
        avoidCollisions={avoidCollisions}
        sideOffset={sideOffset}
        collisionPadding={12}
      >
        {menuConfig.menuItems?.map(item => {
          const Icon = buildIconConfig(item.icon as MenuItemIcon);

          return (
            <MenuItemComponent
              value={item.menuState ?? 'off'}
              destructive={item.destructive}
              key={item.actionKey}
              onSelect={() => handleSelectItem(item.actionKey)}
            >
              <DropdownMenuItemTitle>{item.actionTitle}</DropdownMenuItemTitle>
              {Icon}
            </MenuItemComponent>
          );
        })}

        {!!menuConfig.menuTitle?.trim() && (
          <DropdownMenuPrimitive.Group>
            <MenuItemComponent disabled>
              <DropdownMenuItemTitle>{menuConfig.menuTitle}</DropdownMenuItemTitle>
            </MenuItemComponent>
          </DropdownMenuPrimitive.Group>
        )}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}
