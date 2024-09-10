import * as DropdownMenuPrimitive from 'zeego/dropdown-menu';
import styled from 'styled-components';
import { MenuTriggerProps } from 'zeego/lib/typescript/menu';
export * from 'zeego/dropdown-menu';

type DropdownMenuPrimitiveProps = MenuTriggerProps & {
  testID?: string;
};

export const DropdownMenuItem = DropdownMenuPrimitive.create(
  styled(DropdownMenuPrimitive.Item)({
    height: 34,
  }),
  'Item'
);

export const DropdownMenuTrigger = DropdownMenuPrimitive.create<DropdownMenuPrimitiveProps>(
  styled(DropdownMenuPrimitive.Trigger)({}),
  'Trigger'
);

export type DropDownMenuItemProps = {
  actionKey: string;
  actionTitle: string;
  icon?: {
    iconType: string;
    iconValue: string;
  };
};

type DropdownMenuProps = {
  testID?: string;
  children: React.ReactElement;
  items: DropDownMenuItemProps[];
};

export function DropdownMenu({ testID, children, items }: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root onOpenChange={console.log}>
      <DropdownMenuTrigger testID={testID}>{children}</DropdownMenuTrigger>
      <DropdownMenuPrimitive.Content loop avoidCollisions align="start" side="bottom" alignOffset={0} sideOffset={5} collisionPadding={5}>
        {items.map(item => (
          <DropdownMenuItem key={item.actionKey}>
            <DropdownMenuPrimitive.ItemTitle>{item.actionTitle}</DropdownMenuPrimitive.ItemTitle>
          </DropdownMenuItem>
        ))}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Root>
  );
}
