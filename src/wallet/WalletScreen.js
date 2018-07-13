import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { ScrollView, SectionList } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/primitives';
import {
  AssetListHeader,
  AssetListItem,
  BalanceCoinRow,
  // UniqueTokenGridList,
} from '../components/asset-list';
import { FabWrapper, WalletConnectFab } from '../components/fab';
import { colors } from '../styles';
import WalletHeader from './WalletHeader';

const Container = styled(ScrollView)`
  background-color: ${colors.white}
`;

const Separator = styled.View`
  height: 27;
`;

const keyExtractor = (item, index) => {
  const key = Array.isArray(item) ? item[0] : get(item, 'symbol');
  return key + index;
};

const WalletScreen = ({ accountInfo, ...props }) => {
  const sections = {
    balances: {
      title: 'Balances',
      totalValue: accountInfo.total.display || '---',
      data: accountInfo.assets,
      renderItem: BalanceCoinRow,
    },
    /* collectibles: {
      title: 'Collectibles',
      totalValue: '',
      data: [uniqueTokens],
      renderItem: UniqueTokenGridList,
    },*/
  };

  return (
    <FabWrapper fabs={[<WalletConnectFab key="walletConnectFab" />]}>
      <Container>
        <WalletHeader {...props} />
        <SectionList
          keyExtractor={keyExtractor}
          renderItem={AssetListItem}
          renderSectionFooter={() => <Separator />}
          renderSectionHeader={headerProps => <AssetListHeader {...headerProps} />}
          sections={[sections.balances]}
        />
      </Container>
    </FabWrapper>
  );
};

WalletScreen.propTypes = {
  accountInfo: PropTypes.object.isRequired,
  fetching: PropTypes.bool.isRequired,
  fetchingUniqueTokens: PropTypes.bool.isRequired,
  uniqueTokens: PropTypes.array.isRequired,
};

const reduxProps = ({ account }) => ({
  accountInfo: account.accountInfo,
  fetching: account.fetching,
  fetchingUniqueTokens: account.fetchingUniqueTokens,
  uniqueTokens: account.uniqueTokens,
});

export default connect(reduxProps, null)(WalletScreen);
