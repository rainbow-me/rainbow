import React from 'react';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { ButtonPressAnimation } from '@/components/animations';
import { Inline, Inset, Text } from '@/design-system';
import { haptics } from '@/utils';
import { CollectibleSortByOptions } from '@/hooks/useNFTsSortBy';

type MenuItem = {
  actionKey: string;
  actionTitle: string;
  menuState?: 'on' | 'off';
};

type ListHeaderMenuProps = {
  selected: CollectibleSortByOptions;
  menuItems: MenuItem[];
  selectItem: (item: string) => void;
  text: string;
};

export function ListHeaderMenu({
  menuItems,
  selectItem,
  text,
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
            <Inline alignVertical="center" horizontalSpace={'2px'}>
              <Text color="label" size="17pt" weight="semibold">
                {text}
              </Text>
              <Text color="label" size="15pt" weight="semibold">
                􀆈
              </Text>
            </Inline>
          </Inline>
        </Inset>
      </ButtonPressAnimation>
    </ContextMenuButton>
  );
}
