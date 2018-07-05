import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FlatList, SectionList, ScrollView } from 'react-native';

import styled from 'styled-components/primitives';
import Row from '../components/layout/Row';
import BalanceCoinRow from '../components/asset-list/BalanceCoinRow';
import TransactionCoinRow from '../components/asset-list/TransactionCoinRow';
import AssetListHeader from '../components/asset-list/AssetListHeader';
import AssetListItem from '../components/asset-list/AssetListItem';

import Avatar from '../components/Avatar';

const TabItems = ['Balances', 'Transactions', 'Interactions'];

const Header = styled(Row)`
  height: 98;
  padding-left: 20;
  padding-bottom: 20;
`;

const Container = styled(ScrollView)`

`;

const Separator = styled.View`
  height: 27;
`;

class WalletScreen extends Component {
  static propTypes = {
    loading: PropTypes.bool,
    wallet: PropTypes.object,
  }

  static navigatorStyle = {
    navBarHidden: true,
  }

  render() {
    const { loading, wallet } = this.props;
    const { assets = [] } = wallet;

    console.log('loading wallet', loading);

    return (
      <Container>
        <Header align="end">
          <Avatar />
        </Header>
        <SectionList
          keyExtractor={(item, index) => item + index}
          renderItem={AssetListItem}
          renderSectionHeader={AssetListHeader}
          renderSectionFooter={() => <Separator />}
          sections={[
            { title: 'Balance', data: assets, renderItem: BalanceCoinRow },
            { title: 'Collectables', data: ['item3', 'item4'] },
          ]}
        />
      </Container>
    );
  }
}
export default WalletScreen;
