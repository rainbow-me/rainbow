import React from 'react';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Inline, Inset, Text } from '@/design-system';
import { haptics } from '@/utils';
import { SortCriterion } from '@/graphql/__generated__/arc';
import * as i18n from '@/languages';
import ConditionalWrap from 'conditional-wrap';
import { analyticsV2 } from '@/analytics';
import { atom, useRecoilState } from 'recoil';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();

type Filter = 'all' | 'paid' | 'free';

export type SortOption = {
  name: string;
  icon: string;
  criterion: SortCriterion;
};

export const SortOptions: { [key: string]: SortOption } = {
  Highest: {
    name: i18n.t(i18n.l.nft_offers.sort_menu.highest),
    icon: '􀑁',
    criterion: SortCriterion.TopBidValue,
  },
  FromFloor: {
    name: i18n.t(i18n.l.nft_offers.sort_menu.from_floor),
    icon: '􀅺',
    criterion: SortCriterion.FloorDifferencePercentage,
  },
  Recent: {
    name: i18n.t(i18n.l.nft_offers.sort_menu.recent),
    icon: '􀐫',
    criterion: SortCriterion.DateCreated,
  },
} as const;

const MMKV_KEY = 'mintDotFunFilter';

export const mintDotFunFilterAtom = atom<Filter>({
  default: (mmkv.getString(MMKV_KEY) as Filter | undefined) ?? 'all',
  key: 'mintDotFunFilter',
});

const getSortOptionFromCriterion = (criterion: SortCriterion) => {
  switch (criterion) {
    case SortCriterion.TopBidValue:
      return SortOptions.Highest;
    case SortCriterion.FloorDifferencePercentage:
      return SortOptions.FromFloor;
    case SortCriterion.DateCreated:
      return SortOptions.Recent;
    default:
      return SortOptions.Highest;
  }
};

export const Menu = () => {
  const [filter, setFilter] = useRecoilState(mintDotFunFilterAtom);

  const menuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: 'all',
        actionTitle: 'All',
        menuState: filter === 'all' ? 'on' : 'off',
      },
      {
        actionKey: 'paid',
        actionTitle: 'Paid',
        menuState: filter === 'paid' ? 'on' : 'off',
      },
      {
        actionKey: 'free',
        actionTitle: 'Free',
        menuState: filter === 'free' ? 'on' : 'off',
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
    // analyticsV2.track(analyticsV2.event.nftOffersSelectedSortCriterion, {
    //   sortCriterion: sortCriterion,
    // });
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
};
