import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import styled from 'styled-components/native';
import { convertAmountToPercentageDisplay } from '../../helpers/utilities';
import { DefaultTokenLists } from '../../references';
import ButtonPressAnimation from '../animations/ButtonPressAnimation/ButtonPressAnimation.ios';
import { ListCoinRow } from '../coin-row';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/ChartExpandedState';
import { Centered, Column, Flex, Row } from '../layout';

import { Emoji, Text } from '../text';
import {
  useAccountAssets,
  useAccountSettings,
  useUniswapAssets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import { ethereumUtils } from '@rainbow-me/utils';

const ListButton = styled(ButtonPressAnimation).attrs({
  scaleTo: 0.96,
})`
  margin-right: 20;
  ${({ selected }) =>
    selected
      ? `
        background-color: ${colors.alpha(colors.blueGreyDark, 0.06)};
        padding-left: 8px;
        padding-right: 8px;
        padding-top: 6px;
        padding-bottom: 6px;
        border-radius: 12px;
      `
      : `
        padding-top: 6px;
      `}
`;

const ListName = styled(Text)`
  margin-left: 5px;
  margin-top: -5px;
`;

const DEFAULT_LIST = 'favorites';

const formatGenericAsset = asset => {
  return {
    ...asset,
    native: {
      change: asset?.price?.relative_change_24h
        ? convertAmountToPercentageDisplay(
            `${asset?.price?.relative_change_24h}`
          )
        : '',
    },
  };
};

export default function ListSection() {
  const { network } = useAccountSettings();
  const { navigate } = useNavigation();
  const [selectedList, setSelectedList] = useState(DEFAULT_LIST);
  const { favorites, lists } = useUniswapAssets();
  const { allAssets } = useAccountAssets();
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));

  const listItems = useMemo(() => {
    if (selectedList === 'favorites') {
      return favorites.map(item =>
        ethereumUtils.getAsset(allAssets, item.address)
      );
    } else {
      if (!lists?.length) return [];
      const currentList = lists.find(list => list.id === selectedList);
      if (!currentList) {
        return [];
      }
      return currentList.tokens.map(address => {
        const asset =
          ethereumUtils.getAsset(allAssets, address) ||
          formatGenericAsset(genericAssets[address]);
        return asset;
      });
    }
  }, [allAssets, favorites, genericAssets, lists, selectedList]);

  const handleSwitchList = useCallback(id => {
    setSelectedList(id);
  }, []);

  const handlePress = useCallback(
    item => {
      navigate(
        ios ? Routes.EXPANDED_ASSET_SHEET : Routes.EXPANDED_ASSET_SCREEN,
        {
          asset: item,
          longFormHeight: initialChartExpandedStateSheetHeight,
          type: 'token',
        }
      );
    },
    [navigate]
  );

  const itemProps = useMemo(
    () => ({
      showAddButton: true,
      showBalance: false,
    }),
    []
  );

  return (
    <Column>
      <Flex marginBottom={10} paddingHorizontal={19}>
        <Text size="larger" weight="bold">
          Lists
        </Text>
      </Flex>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 19 }}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {DefaultTokenLists[network].map(list => (
          <ListButton
            key={`list-${list.id}`}
            onPress={() => handleSwitchList(list.id)}
            selected={selectedList === list.id}
          >
            <Row>
              <Emoji name={list.emoji} size="smedium" />
              <ListName
                color={
                  selectedList === list.id
                    ? colors.alpha(colors.blueGreyDark, 0.8)
                    : colors.blueGreyDark50
                }
                lineHeight="paragraphSmall"
                size="lmedium"
                weight="bold"
              >
                {list.name}
              </ListName>
            </Row>
          </ListButton>
        ))}
      </ScrollView>
      <Column marginTop={15}>
        {listItems?.length ? (
          listItems.map((item, i) => (
            <ListCoinRow
              {...itemProps}
              item={item}
              key={`${selectedList}-list-item-${i}`}
              onPress={() => handlePress(item)}
            />
          ))
        ) : (
          <Centered marginBottom={30} marginTop={30}>
            <Text color={colors.blueGreyDark50} size="large">
              This list is empty!
            </Text>
          </Centered>
        )}
      </Column>
    </Column>
  );
}
