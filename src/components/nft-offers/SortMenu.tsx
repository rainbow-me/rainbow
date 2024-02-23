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

const MMKV_KEY = 'nftOffersSort';

export const nftOffersSortAtom = atom<SortCriterion>({
  default: (mmkv.getString(MMKV_KEY) as SortCriterion | undefined) ?? SortOptions.Highest.criterion,
  key: 'nftOffersSort',
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

export const SortMenu = ({ type }: { type: 'card' | 'sheet' }) => {
  const [sortCriterion, setSortCriterion] = useRecoilState(nftOffersSortAtom);
  const sortOption = getSortOptionFromCriterion(sortCriterion);

  const menuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: SortOptions.Highest.criterion,
        actionTitle: SortOptions.Highest.name,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'chart.line.uptrend.xyaxis',
        },
        menuState: sortOption.criterion === SortOptions.Highest.criterion ? 'on' : 'off',
      },
      {
        actionKey: SortOptions.FromFloor.criterion,
        actionTitle: SortOptions.FromFloor.name,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'plus.forwardslash.minus',
        },
        menuState: sortOption.criterion === SortOptions.FromFloor.criterion ? 'on' : 'off',
      },
      {
        actionKey: SortOptions.Recent.criterion,
        actionTitle: SortOptions.Recent.name,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'clock',
        },
        menuState: sortOption.criterion === SortOptions.Recent.criterion ? 'on' : 'off',
      },
    ],
  };

  const onPressMenuItem = ({ nativeEvent: { actionKey: sortCriterion } }: { nativeEvent: { actionKey: SortCriterion } }) => {
    haptics.selection();
    setSortCriterion(sortCriterion);
    mmkv.set(MMKV_KEY, sortCriterion);
    analyticsV2.track(analyticsV2.event.nftOffersSelectedSortCriterion, {
      sortCriterion: sortCriterion,
    });
  };

  return (
    <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={onPressMenuItem}>
      <ButtonPressAnimation>
        <ConditionalWrap
          condition={type === 'sheet'}
          wrap={(children: React.ReactNode) => (
            <Box
              background="surfaceSecondaryElevated"
              borderRadius={99}
              justifyContent="center"
              alignItems="center"
              paddingHorizontal="12px"
              paddingVertical={{ custom: 13 }}
            >
              {children}
            </Box>
          )}
        >
          <Inset top={type === 'sheet' ? undefined : '2px'}>
            <Inline alignVertical="center" space={{ custom: 5 }}>
              <Text size={type === 'sheet' ? '13pt' : '15pt'} weight={type === 'sheet' ? 'heavy' : 'bold'} color="labelTertiary">
                {sortOption.icon}
              </Text>
              <Inline alignVertical="center">
                <Text color="label" size={type === 'sheet' ? '15pt' : '17pt'} weight={type === 'sheet' ? 'heavy' : 'bold'}>
                  {sortOption.name + ' '}
                </Text>
                <Text color="label" size={type === 'sheet' ? '13pt' : '15pt'} weight={type === 'sheet' ? 'heavy' : 'bold'}>
                  􀆈
                </Text>
              </Inline>
            </Inline>
          </Inset>
        </ConditionalWrap>
      </ButtonPressAnimation>
    </ContextMenuButton>
  );
};
