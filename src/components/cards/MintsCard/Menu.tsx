import React from 'react';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { ButtonPressAnimation } from '@/components/animations';
import { Inline, Inset, Text } from '@/design-system';
import { haptics } from '@/utils';
import { MintsFilter, getMintsFilterLabel, useMintsFilter } from '@/resources/mints';
import { MenuConfig } from 'react-native-ios-context-menu';

export function Menu() {
  const { filter, setFilter } = useMintsFilter();

  const menuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: MintsFilter.All,
        actionTitle: getMintsFilterLabel(MintsFilter.All),
        menuState: filter === MintsFilter.All ? 'on' : 'off',
      },
      {
        actionKey: MintsFilter.Free,
        actionTitle: getMintsFilterLabel(MintsFilter.Free),
        menuState: filter === MintsFilter.Free ? 'on' : 'off',
      },
      {
        actionKey: MintsFilter.Paid,
        actionTitle: getMintsFilterLabel(MintsFilter.Paid),
        menuState: filter === MintsFilter.Paid ? 'on' : 'off',
      },
    ],
  } satisfies MenuConfig;

  const onPressMenuItem = ({ nativeEvent: { actionKey: filter } }: { nativeEvent: { actionKey: string } }) => {
    haptics.selection();
    setFilter(filter as MintsFilter);
  };

  return (
    <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={onPressMenuItem}>
      <ButtonPressAnimation>
        <Inset top="2px">
          <Inline alignVertical="center" space={{ custom: 5 }}>
            <Inline alignVertical="center">
              <Text color="label" size="17pt" weight="bold">
                {menuConfig.menuItems.find(item => item.actionKey === filter)?.actionTitle}
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
