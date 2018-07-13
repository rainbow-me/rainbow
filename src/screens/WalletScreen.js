import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { SectionList, ScrollView } from 'react-native';
import styled from 'styled-components/primitives';
import Row from '../components/layout/Row';
import AssetListHeader from '../components/asset-list/AssetListHeader';
import AssetListItem from '../components/asset-list/AssetListItem';
import BalanceCoinRow from '../components/asset-list/BalanceCoinRow';
import UniqueTokenGridList from '../components/asset-list/UniqueTokenGridList';
import Avatar from '../components/Avatar';
import { connect } from 'react-redux';

const Header = styled(Row)`
  height: 98;
  padding-left: 20;
  padding-bottom: 20;
`;

const Separator = styled.View`
  height: 27;
`;

class WalletScreen extends Component {
  static propTypes = {
    accountInfo: PropTypes.object.isRequired,
    fetching: PropTypes.bool.isRequired,
    uniqueTokens: PropTypes.array.isRequired,
    fetchingUniqueTokens: PropTypes.bool.isRequired,
  }

  static navigatorStyle = {
    navBarHidden: true,
  }

  render() {
    const { accountInfo, uniqueTokens } = this.props;

    return (
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
          { title: 'Balances', totalValue: accountInfo.total.display || '---', data: accountInfo.assets, renderItem: BalanceCoinRow },
          /*{ title: 'Collectibles', totalValue: '', data: [uniqueTokens], renderItem: UniqueTokenGridList },*/
        ]}
      />
    </ScrollView>
    );
  }
}

const reduxProps = ( { account } ) => ({
  accountInfo: account.accountInfo,
  fetching: account.fetching,
  uniqueTokens: account.uniqueTokens,
  fetchingUniqueTokens: account.fetchingUniqueTokens,
});

export default connect(
  reduxProps,
  null
)(WalletScreen);
