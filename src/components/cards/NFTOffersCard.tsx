import {
  Bleed,
  Box,
  Inline,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import React, { useCallback, useMemo, useState } from 'react';
import { ButtonPressAnimation, ShimmerAnimation } from '../animations';
import { useDimensions } from '@/hooks';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { haptics } from '@/utils';
import { RainbowError, logger } from '@/logger';
import { MarqueeList } from '../list';
import { ScrollView } from 'react-native';
import { AssetTypes } from '@/entities';
import { CoinIcon } from '../coin-icon';

const SortBy = {
  Highest: { name: 'Highest', icon: '􀑁', key: 'highest' },
  FromFloor: { name: 'From Floor', icon: '􀅺', key: 'fromFloor' },
  Recent: { name: 'Recent', icon: '􀐫', key: 'recent' },
} as const;

const Offer = () => {
  return (
    <Stack space="12px">
      <Box
        width={{ custom: 77.75 }}
        height={{ custom: 77.75 }}
        background="blue"
        borderRadius={12}
      />
      <Stack space={{ custom: 7 }}>
        <Inline space="4px" alignVertical="center">
          <CoinIcon
            // mainnet_address={'0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'}
            // address="0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"
            address="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
            size={12}
            // badgeSize="tiny"
            symbol="WETH"
            // type={AssetTypes.polygon}
          />
          <Text size="13pt" weight="heavy">
            10.5
          </Text>
        </Inline>
        <Text color="green" size="13pt" weight="semibold">
          +29.4%
        </Text>
      </Stack>
    </Stack>
  );
};

export const NFTOffersCard = () => {
  const [sortBy, setSortBy] = useState<keyof typeof SortBy>(SortBy.Highest);
  const NUM_OFFERS = 65;
  const TOTAL_VALUE_USD = '$42.4k';
  const borderColor = useForegroundColor('separator');
  const buttonColor = useForegroundColor('fillSecondary');
  const { width: deviceWidth } = useDimensions();

  const menuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: SortBy.Highest.key,
        actionTitle: SortBy.Highest.name,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'chart.line.uptrend.xyaxis',
        },
        menuState: sortBy.key === SortBy.Highest.key ? 'on' : 'off',
      },
      {
        actionKey: SortBy.FromFloor.key,
        actionTitle: SortBy.FromFloor.name,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'plus.forwardslash.minus',
        },
        menuState: sortBy.key === SortBy.FromFloor.key ? 'on' : 'off',
      },
      {
        actionKey: SortBy.Recent.key,
        actionTitle: SortBy.Recent.name,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'clock',
        },
        menuState: sortBy.key === SortBy.Recent.key ? 'on' : 'off',
      },
    ],
  };

  const onPressMenuItem = ({ nativeEvent: { actionKey } }) => {
    haptics.selection();
    switch (actionKey) {
      case SortBy.Highest.key:
        setSortBy(SortBy.Highest);
        break;
      case SortBy.FromFloor.key:
        setSortBy(SortBy.FromFloor);
        break;
      case SortBy.Recent.key:
        setSortBy(SortBy.Recent);
        break;
      default:
        logger.error(
          new RainbowError('NFTOffersCard: invalid context menu key')
        );
        break;
    }
  };

  return (
    <Box width="full">
      <Stack space="20px">
        <Inline alignVertical="center" alignHorizontal="justify">
          <Inline alignVertical="center" space={{ custom: 7 }}>
            <Text weight="heavy" size="20pt">{`${NUM_OFFERS} Offers`}</Text>
            <Box
              style={{
                borderWidth: 1,
                borderColor,
                borderRadius: 7,
              }}
              justifyContent="center"
              alignItems="center"
              padding={{ custom: 5 }}
            >
              <Text
                align="center"
                color="labelTertiary"
                size="13pt"
                weight="semibold"
              >
                {TOTAL_VALUE_USD}
              </Text>
            </Box>
          </Inline>

          <ContextMenuButton
            menuConfig={menuConfig}
            // onPressAndroid={onPressAndroid}
            onPressMenuItem={onPressMenuItem}
          >
            <ButtonPressAnimation>
              <Inline alignVertical="center">
                <Text size="15pt" weight="bold" color="labelTertiary">
                  {sortBy.icon}
                </Text>
                <Text size="17pt" weight="bold">
                  {` ${sortBy.name} `}
                </Text>
                <Text size="15pt" weight="bold">
                  􀆈
                </Text>
              </Inline>
            </ButtonPressAnimation>
          </ContextMenuButton>
        </Inline>
        <Bleed horizontal="20px">
          <ScrollView horizontal style={{ paddingLeft: 20 }}>
            <Inline space={{ custom: 14 }}>
              <Offer />
              <Offer />
              <Offer />
            </Inline>
          </ScrollView>
        </Bleed>
        <Box
          as={ButtonPressAnimation}
          background="fillSecondary"
          height="36px"
          width="full"
          borderRadius={99}
          justifyContent="center"
          alignItems="center"
          style={{ overflow: 'hidden' }}
        >
          {/* unfortunately shimmer width must be hardcoded */}
          <ShimmerAnimation color={buttonColor} width={deviceWidth - 40} />
          <Text align="center" size="15pt" weight="bold">
            View All Offers
          </Text>
        </Box>
      </Stack>
    </Box>
  );
};
