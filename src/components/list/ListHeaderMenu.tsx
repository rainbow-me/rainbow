import React from 'react';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { ButtonPressAnimation } from '@/components/animations';
import { Inline, Inset, Text } from '@/design-system';
import { haptics } from '@/utils';

type MenuItem = {
  actionKey: string;
  actionTitle: string;
  menuState?: 'on' | 'off';
};

type ListHeaderMenuProps = {
  selected: MenuItem;
  menuItems: MenuItem[];
  selectItem: (item: string) => void;
};

export function ListHeaderMenu({
  selected,
  menuItems,
  selectItem,
}: ListHeaderMenuProps) {
  const menuConfig = {
    menuTitle: '',
    menuItems: menuItems,
  };

  const onPressMenuItem = ({
    nativeEvent: { actionKey: item },
  }: {
    nativeEvent: { actionKey: string };
  }) => {
    haptics.selection();
    selectItem(item);
  };

  return (
    <ContextMenuButton
      menuConfig={menuConfig}
      onPressMenuItem={onPressMenuItem}
    >
      <ButtonPressAnimation>
        <Inset top="2px">
          <Inline alignVertical="center" space={{ custom: 5 }}>
            <Inline alignVertical="center">
              <Text color="label" size="17pt" weight="bold">
                {typeof selected === 'string' ? selected : selected.actionTitle}
              </Text>
              <Text color="label" size="15pt" weight="bold">
                􀆈
              </Text>
            </Inline>
          </Inline>
        </Inset>
      </ButtonPressAnimation>
    </ContextMenuButton>
  );
}
