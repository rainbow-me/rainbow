import React from 'react';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { ButtonPressAnimation } from '../animations';
import { Box, Inline, Inset, Text } from '@/design-system';
import { haptics } from '@/utils';
import { RainbowError, logger } from '@/logger';
import { SortCriterion } from '@/graphql/__generated__/arc';
import * as i18n from '@/languages';
import ConditionalWrap from 'conditional-wrap';

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

export const SortMenu = ({
  sortOption,
  setSortOption,
  type,
}: {
  sortOption: SortOption;
  setSortOption: (sortOption: SortOption) => void;
  type: 'card' | 'sheet';
}) => {
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
        menuState:
          sortOption.criterion === SortOptions.Highest.criterion ? 'on' : 'off',
      },
      {
        actionKey: SortOptions.FromFloor.criterion,
        actionTitle: SortOptions.FromFloor.name,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'plus.forwardslash.minus',
        },
        menuState:
          sortOption.criterion === SortOptions.FromFloor.criterion
            ? 'on'
            : 'off',
      },
      {
        actionKey: SortOptions.Recent.criterion,
        actionTitle: SortOptions.Recent.name,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'clock',
        },
        menuState:
          sortOption.criterion === SortOptions.Recent.criterion ? 'on' : 'off',
      },
    ],
  };

  const onPressMenuItem = ({
    nativeEvent: { actionKey },
  }: {
    nativeEvent: { actionKey: SortCriterion };
  }) => {
    haptics.selection();
    switch (actionKey) {
      case SortOptions.Highest.criterion:
        setSortOption(SortOptions.Highest);
        break;
      case SortOptions.FromFloor.criterion:
        setSortOption(SortOptions.FromFloor);
        break;
      case SortOptions.Recent.criterion:
        setSortOption(SortOptions.Recent);
        break;
      default:
        logger.error(
          new RainbowError('NFTOffersCard: invalid context menu key')
        );
        break;
    }
  };

  return (
    <ContextMenuButton
      menuConfig={menuConfig}
      onPressMenuItem={onPressMenuItem}
    >
      <ButtonPressAnimation>
        <ConditionalWrap
          condition={type === 'sheet'}
          wrap={children => (
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
              <Text
                size={type === 'sheet' ? '13pt' : '15pt'}
                weight={type === 'sheet' ? 'heavy' : 'bold'}
                color="labelTertiary"
              >
                {sortOption.icon}
              </Text>
              <Inline alignVertical="center">
                <Text
                  color="label"
                  size={type === 'sheet' ? '15pt' : '17pt'}
                  weight={type === 'sheet' ? 'heavy' : 'bold'}
                >
                  {sortOption.name + ' '}
                </Text>
                <Text
                  color="label"
                  size={type === 'sheet' ? '13pt' : '15pt'}
                  weight={type === 'sheet' ? 'heavy' : 'bold'}
                >
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
