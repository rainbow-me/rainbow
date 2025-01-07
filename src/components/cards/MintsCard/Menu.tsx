import React, { useCallback, useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Inline, Inset, Text } from '@/design-system';
import { haptics } from '@/utils';
import { MintsFilter, getMintsFilterLabel, useMintsFilter } from '@/resources/mints';
import { DropdownMenu, MenuConfig } from '@/components/DropdownMenu';

export function Menu() {
  const { filter, setFilter } = useMintsFilter();

  const menuConfig = useMemo<MenuConfig<MintsFilter>>(() => {
    return {
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
    };
  }, [filter]);

  const onPressMenuItem = useCallback(
    (selection: MintsFilter) => {
      haptics.selection();
      setFilter(selection);
    },
    [setFilter]
  );

  return (
    <DropdownMenu<MintsFilter> menuItemType="checkbox" menuConfig={menuConfig} onPressMenuItem={onPressMenuItem}>
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
    </DropdownMenu>
  );
}
