import PropTypes from 'prop-types';
import React from 'react';
import { SectionList, ScrollView } from 'react-native';
import styled from 'styled-components/primitives';
import Row from '../components/layout/Row';
import AssetListHeader from '../components/asset-list/AssetListHeader';
import AssetListItem from '../components/asset-list/AssetListItem';
import BalanceCoinRow from '../components/asset-list/BalanceCoinRow';
import Avatar from '../components/Avatar';

const Header = styled(Row)`
  height: 98;
  padding-left: 20;
  padding-bottom: 20;
`;

const Separator = styled.View`
  height: 27;
`;

const WalletScreen = ({ wallet: { assets = [] } }) => (
  <ScrollView>
    <Header align="end">
      <Avatar />
    </Header>
    <SectionList
      keyExtractor={(item, index) => item + index}
      renderItem={AssetListItem}
      renderSectionHeader={props => <AssetListHeader {...props} />}
      renderSectionFooter={() => <Separator />}
      sections={[
        { title: 'Balances', totalValue: '456.60', data: assets, renderItem: BalanceCoinRow },
        { title: 'Collectables', totalValue: '26.32', data: ['item3', 'item4'] },
      ]}
    />
  </ScrollView>
);

WalletScreen.propTypes = {
  loading: PropTypes.bool,
  wallet: PropTypes.object,
};

export default WalletScreen;
