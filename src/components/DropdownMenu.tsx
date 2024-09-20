import * as DropdownMenu from 'zeego/dropdown-menu';
import styled from 'styled-components';

export const DropdownMenuRoot = DropdownMenu.Root;
export const DropdownMenuTrigger = DropdownMenu.Trigger;
export const DropdownMenuContent = DropdownMenu.Content;
export const DropdownMenuItem = DropdownMenu.create(
  styled(DropdownMenu.Item)({
    height: 34,
  }),
  'Item'
);
export const DropdownMenuItemTitle = DropdownMenu.ItemTitle;
export const DropdownMenuItemIcon = DropdownMenu.ItemIcon;
export const DropdownMenuItemImage = DropdownMenu.ItemImage;
