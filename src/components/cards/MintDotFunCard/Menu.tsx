import React from 'react';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { ButtonPressAnimation } from '@/components/animations';
import { Inline, Inset, Text } from '@/design-system';
import { haptics } from '@/utils';
import * as i18n from '@/languages';
import {
  MintableCollectionsFilter,
  getMintableCollectionsFilterLabel,
  useMintableCollectionsFilter,
} from '@/resources/mintdotfun';

export function Menu() {
  const { filter, setFilter } = useMintableCollectionsFilter();

  const menuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: MintableCollectionsFilter.All,
        actionTitle: getMintableCollectionsFilterLabel(
          MintableCollectionsFilter.All
        ),
        menuState: filter === MintableCollectionsFilter.All ? 'on' : 'off',
      },
      {
        actionKey: MintableCollectionsFilter.Free,
        actionTitle: getMintableCollectionsFilterLabel(
          MintableCollectionsFilter.Free
        ),
        menuState: filter === MintableCollectionsFilter.Free ? 'on' : 'off',
      },
      {
        actionKey: MintableCollectionsFilter.Paid,
        actionTitle: getMintableCollectionsFilterLabel(
          MintableCollectionsFilter.Paid
        ),
        menuState: filter === MintableCollectionsFilter.Paid ? 'on' : 'off',
      },
    ],
  };

  const onPressMenuItem = ({
    nativeEvent: { actionKey: filter },
  }: {
    nativeEvent: { actionKey: MintableCollectionsFilter };
  }) => {
    haptics.selection();
    setFilter(filter);
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
                {
                  menuConfig.menuItems.find(item => item.actionKey === filter)
                    ?.actionTitle
                }
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
