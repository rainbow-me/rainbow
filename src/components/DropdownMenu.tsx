import React, { useCallback } from 'react';
import * as DropdownMenuPrimitive from 'zeego/dropdown-menu';
import styled from 'styled-components';
import { IconConfig, MenuActionConfig, MenuConfig as _MenuConfig } from 'react-native-ios-context-menu';
import { ImageSystemSymbolConfiguration } from 'react-native-ios-context-menu/lib/typescript/types/ImageItemConfig';
import { ImageSourcePropType } from 'react-native';
import type { SFSymbols5_0 } from 'sf-symbols-typescript';
import type { DropdownMenuContentProps } from '@radix-ui/react-dropdown-menu';

export const DropdownMenuRoot = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuContent = DropdownMenuPrimitive.Content;
export const DropdownMenuItem = DropdownMenuPrimitive.create(
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

export type MenuItemIcon = Omit<IconConfig, 'iconValue' | 'iconType'> & (MenuItemSystemImage | MenuItemAssetImage);

export type MenuItem<T> = Omit<MenuActionConfig, 'icon'> & {
  actionKey: T;
  actionTitle: string;
  icon?: MenuItemIcon | { iconType: string; iconValue: string };
};

export type MenuConfig<T extends string> = Omit<_MenuConfig, 'menuItems' | 'menuTitle'> & {
  menuTitle?: string;
  menuItems: Array<MenuItem<T>>;
};

type DropDownMenuProps<T extends string> = {
  children: React.ReactElement;
  menuConfig: MenuConfig<T>;
  onPressMenuItem: (actionKey: T) => void;
} & DropdownMenuContentProps;

const buildIconConfig = (icon?: MenuItemIcon) => {
  if (!icon) return null;

  if (icon.iconType === 'SYSTEM' && typeof icon.iconValue === 'string') {
    const ios = { name: icon.iconValue };

    return <DropdownMenuItemIcon ios={ios} />;
  }

  if (icon.iconType === 'ASSET' && typeof icon.iconValue === 'object') {
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
}: DropDownMenuProps<T>) {
  const handleSelectItem = useCallback(
    (actionKey: T) => {
      onPressMenuItem(actionKey);
    },
    [onPressMenuItem]
  );

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        loop={loop}
        side={side}
        align={align}
        alignOffset={alignOffset}
        avoidCollisions={avoidCollisions}
        sideOffset={sideOffset}
        collisionPadding={12}
      >
        {!!menuConfig.menuTitle?.trim() && (
          <DropdownMenuPrimitive.Group>
            <DropdownMenuItem disabled>
              <DropdownMenuItemTitle>{menuConfig.menuTitle}</DropdownMenuItemTitle>
            </DropdownMenuItem>
          </DropdownMenuPrimitive.Group>
        )}
        {menuConfig.menuItems?.map(item => {
          const Icon = buildIconConfig(item.icon as MenuItemIcon);

          return (
            <DropdownMenuItem value={item.menuState ?? 'off'} key={item.actionKey} onSelect={() => handleSelectItem(item.actionKey)}>
              <DropdownMenuItemTitle>{item.actionTitle}</DropdownMenuItemTitle>
              {Icon}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}
