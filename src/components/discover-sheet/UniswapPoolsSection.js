/* eslint-disable sort-keys */
import { sortBy } from 'lodash';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutAnimation } from 'react-native';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import UniswapLogo from '../icons/UniswapLogo';
import { UniswapPoolListRow } from '../investment-cards';
import { Column, Row } from '../layout';
import { Text } from '../text';
import EdgeFade from './EdgeFade';

const PoolsSample = [
  {
    'name': 'Uniswap V2 DAI-ETH',
    'symbol': 'univ2DAIETH',
    'decimals': 18,
    'type': 'uniswap-v2',
    'icon_url':
      'https://token-icons.s3.amazonaws.com/0xa478c2975ab1ea89e8196811f51a7b7ade33eb11.png',
    'price': {
      value: 106.36118385853452,
      relative_change_24h: 2.390657195442647,
      changed_at: 0,
    },
    'is_displayable': true,
    'is_verified': true,
    'address': '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
    'uniqueId': '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
    'balance': {
      amount: '0.178987293103995993',
      display: '0.179 univ2DAIETH',
    },
    'native': {
      balance: {
        amount: '19.03730039017552561387822893217836',
        display: '$19.04',
      },
      change: '2.39%',
      price: {
        amount: 106.36118385853452,
        display: '$106.36',
      },
    },
    'tokens': [
      {
        balance: '9.48727670028411709413',
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        decimals: 18,
        name: 'Dai',
        symbol: 'DAI',
        uniqueId: '0x6b175474e89094c44da98b954eedeac495271d0f',
        color: '#F0B340',
        isRainbowCurated: true,
        isVerified: true,
        value: '9.487',
      },
      {
        balance: '0.00558983898186401602',
        address: 'eth',
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
        isRainbowCurated: true,
        isVerified: true,
        uniqueId: 'eth',
        value: '0.00559',
      },
    ],
    'totalSupply': '1434286.784696692925766469',
    'percentageOwned': '0.000012479184429064',
    'pricePerShare': '$106.36',
    'tokenNames': 'DAI-ETH',
    'totalBalancePrice': '19.03730039017552561387822893217836',
    'totalNativeDisplay': '$19.04',
    'uniBalance': '0.179',
    'liquidity': 543210,
    'anualized_fees': 12345,
    '30d_profit': 1234,
    '24h_volume': 332210,
  },
  {
    'name': 'Uniswap AAVEETH Pool',
    'symbol': 'UNI-V2',
    'decimals': 18,
    'type': 'uniswap-v2',
    'icon_url': 'https://token-icons.s3.us-east-1.amazonaws.com/uniswap-v2.png',
    'price': {
      value: 2078.434201464036,
      relative_change_24h: 3.185022468962506,
      changed_at: 0,
    },
    'is_displayable': true,
    'is_verified': true,
    'address': '0xdfc14d2af169b0d36c4eff567ada9b2e0cae044f',
    'uniqueId': '0xdfc14d2af169b0d36c4eff567ada9b2e0cae044f',
    'balance': {
      amount: '0.03055668468469635',
      display: '0.0306 UNI-V2',
    },
    'native': {
      balance: {
        amount: '63.5100585320251968742141054686',
        display: '$63.51',
      },
      change: '3.19%',
      price: {
        amount: 2078.434201464036,
        display: '$2,078.43',
      },
    },
    'tokens': [
      {
        balance: '0.06209617825576930376',
        address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        decimals: 18,
        name: 'Aave',
        symbol: 'AAVE',
        uniqueId: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        color: '#7285B2',
        isRainbowCurated: true,
        isVerified: true,
        value: '0.0621',
      },
      {
        balance: '0.01862736200640838583',
        address: 'eth',
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
        isRainbowCurated: true,
        isVerified: true,
        uniqueId: 'eth',
        value: '0.0186',
      },
    ],
    'totalSupply': '31724.402250801184727386',
    'percentageOwned': '0.000096319181818232',
    'pricePerShare': '$2,078.43',
    'tokenNames': 'AAVE-ETH',
    'totalBalancePrice': '63.5100585320251968742141054686',
    'totalNativeDisplay': '$63.51',
    'uniBalance': '0.0306',
    'liquidity': 987650,
    'anualized_fees': 6789,
    '30d_profit': 56789,
    '24h_volume': 998877,
  },
];

const PoolListButton = styled(ButtonPressAnimation).attrs({
  scaleTo: 0.96,
})`
  margin-right: 16px;
  ${({ selected, theme: { colors } }) =>
    selected
      ? `
        background-color: ${colors.alpha(colors.appleBlue, 0.06)};
        border-radius: 12px;
        height: 30px;
        padding-horizontal: 8px;
        padding-top: ${ios ? 6 : 4}px;
      `
      : `
        padding-top: ${ios ? 6 : 4}px;
      `}
`;

const ListName = styled(Text)`
  margin-left: 3px;
  margin-top: ${ios ? -4.5 : 0}px;
`;

const renderUniswapPoolListRow = item => (
  <UniswapPoolListRow assetType="uniswap" item={item} key={item.uniqueId} />
);

const listData = [
  {
    id: 'anualized_fees',
    name: 'Anualized Fees',
  },
  {
    id: 'liquidity',
    name: 'Liquidity',
  },
  {
    id: '30d_profit',
    name: '30d profit',
  },
  { id: '24h_volume', name: '24h volume' },
];

export default function UniswapPools() {
  const listRef = useRef(null);
  const { colors } = useTheme();
  const [selectedList, setSelectedList] = useState(listData[0].id);
  const [sortCriteria, setSortCriteria] = useState('desc');
  const handleSwitchList = useCallback(
    (id, index) => {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
      );
      if (id === selectedList) {
        setSortCriteria(sortCriteria === 'desc' ? 'asc' : 'desc');
      } else {
        setSelectedList(id);
        listRef.current?.scrollToIndex({
          animated: true,
          index,
          viewPosition: 0.5,
        });
      }
    },
    [selectedList, sortCriteria]
  );

  const renderItem = useCallback(
    ({ item: list, index }) => (
      <PoolListButton
        key={`list-${list.id}`}
        onPress={() => handleSwitchList(list.id, index)}
        selected={selectedList === list.id}
      >
        <Row>
          <ListName
            color={
              selectedList === list.id
                ? colors.alpha(colors.appleBlue, 0.8)
                : colors.alpha(colors.blueGreyDark, 0.5)
            }
            lineHeight="paragraphSmall"
            size="lmedium"
            weight="bold"
          >
            {list.name}{' '}
            {selectedList === list.id
              ? sortCriteria === 'desc'
                ? '􀄩' //'􀄨'
                : '􀄨' // '􀄨'
              : ''}
          </ListName>
        </Row>
      </PoolListButton>
    ),
    [colors, handleSwitchList, selectedList, sortCriteria]
  );

  const pairs = useMemo(() => {
    let sortedPairs = sortBy(PoolsSample, selectedList);
    if (sortCriteria === 'desc') {
      sortedPairs = sortedPairs.reverse();
    }

    return sortedPairs.map(item =>
      renderUniswapPoolListRow({
        ...item,
        attribute: selectedList,
        sort: sortCriteria,
      })
    );
  }, [selectedList, sortCriteria]);

  return (
    <Column marginTop={20}>
      <Row marginBottom={10} paddingHorizontal={22}>
        <UniswapLogo
          borderRadius={7.5}
          height={22}
          imageStyle={{ width: 15, height: 17.5 }}
          marginRight={7}
          marginTop={android ? 8 : 2}
          width={22}
        />
        <Text marginLeft={10} size="larger" weight="bold">
          Uniswap Pools
        </Text>
      </Row>
      <Column>
        <Column>
          <FlatList
            contentContainerStyle={{
              paddingBottom: 19,
              paddingHorizontal: 19,
              paddingTop: 0,
            }}
            data={listData}
            horizontal
            keyExtractor={item => item.id}
            ref={listRef}
            renderItem={renderItem}
            showsHorizontalScrollIndicator={false}
          />
          <EdgeFade />
        </Column>
      </Column>
      {pairs}
    </Column>
  );
}
