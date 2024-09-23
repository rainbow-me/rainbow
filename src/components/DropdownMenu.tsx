import React from 'react';
import * as DropdownMenuPrimitive from 'zeego/dropdown-menu';
import styled from 'styled-components';
import { IconConfig, MenuActionConfig, MenuConfig } from 'react-native-ios-context-menu';

export const DropdownMenuRoot = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuContent = DropdownMenuPrimitive.Content;
export const DropdownMenuItem = DropdownMenuPrimitive.create(
  styled(DropdownMenuPrimitive.Item)({
    height: 34,
  }),
  'Item'
);
export const DropdownMenuItemTitle = DropdownMenuPrimitive.ItemTitle;
export const DropdownMenuItemIcon = DropdownMenuPrimitive.ItemIcon;
export const DropdownMenuItemImage = DropdownMenuPrimitive.ItemImage;

type MenuConfigWithActionConfig = Omit<MenuConfig, 'menuItems' | 'menuTitle'> & {
  menuTitle?: string;
  menuItems: Array<Omit<MenuActionConfig, 'icon'> & { icon: IconConfig }>;
};

type DropDownMenuProps = {
  children: React.ReactElement;
  menuConfig: MenuConfigWithActionConfig;
  onPressMenuItem: (event: React.MouseEvent<HTMLDivElement>) => void;
};

export const DropdownMenu = ({ children, menuConfig, onPressMenuItem }: DropDownMenuProps) => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent loop side="right" align="end" alignOffset={5} avoidCollisions sideOffset={8} collisionPadding={12}>
        {menuConfig.menuItems?.map(item => {
          return (
            <DropdownMenuItem key={item.actionKey} onPress={onPressMenuItem}>
              <DropdownMenuItemTitle>{item.actionTitle}</DropdownMenuItemTitle>

              {/* TODO: Need to figure out symbols / images still */}
              {/* {item.icon && item.icon.iconType === 'SYSTEM' && <DropdownMenuItemIcon ios={{ name: item.icon.iconValue }} />}
              {item.icon && item.icon.iconType === 'ASSET' && <DropdownMenuItemImage source={item.icon.iconValue} />} */}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
