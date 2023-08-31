import React from 'react';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { ButtonPressAnimation } from '@/components/animations';
import { Inline, Inset, Text } from '@/design-system';
import { haptics } from '@/utils';
import * as i18n from '@/languages';
import { atom, useRecoilState } from 'recoil';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();

export enum Filter {
  All = 'all',
  Paid = 'paid',
  Free = 'free',
}

const MMKV_KEY = 'mintDotFunFilter';

export const mintDotFunFilterAtom = atom<Filter>({
  default: (mmkv.getString(MMKV_KEY) as Filter | undefined) ?? Filter.All,
  key: 'mintDotFunFilter',
});

export function Menu() {
  const [filter, setFilter] = useRecoilState(mintDotFunFilterAtom);

  const menuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: Filter.All,
        actionTitle: 'All Mints',
        menuState: filter === Filter.All ? 'on' : 'off',
      },
      {
        actionKey: Filter.Paid,
        actionTitle: 'Paid',
        menuState: filter === Filter.Paid ? 'on' : 'off',
      },
      {
        actionKey: Filter.Free,
        actionTitle: 'Free',
        menuState: filter === Filter.Free ? 'on' : 'off',
      },
    ],
  };

  const onPressMenuItem = ({
    nativeEvent: { actionKey: filter },
  }: {
    nativeEvent: { actionKey: Filter };
  }) => {
    haptics.selection();
    setFilter(filter);
    mmkv.set(MMKV_KEY, filter);
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
