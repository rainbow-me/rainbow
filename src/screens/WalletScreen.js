import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { SectionList } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import styled from 'styled-components/primitives';
import {
  AssetListHeader,
  AssetListItem,
  BalanceCoinRow,
  // UniqueTokenGridList,
} from '../components/asset-list';
import Avatar from '../components/Avatar';
import { ButtonPressAnimation } from '../components/buttons';
import { FabWrapper, WalletConnectFab } from '../components/fab';
import { Header, Page } from '../components/layout';
import { position } from '../styles';

const List = styled(SectionList)`
  ${position.size('100%')}
`;

const Separator = styled.View`
  height: 27;
`;

const keyExtractor = (item, index) => {
  const key = Array.isArray(item) ? item[0] : get(item, 'symbol');
  return key + index;
};

const WalletScreen = ({ accountInfo, onPressProfile }) => {
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
    }, */
  };

  return (
    <Page>
      <FabWrapper fabs={[<WalletConnectFab key="walletConnectFab" />]}>
        <Header>
          <ButtonPressAnimation onPress={onPressProfile}>
            <Avatar />
          </ButtonPressAnimation>
        </Header>
        <List
          keyExtractor={keyExtractor}
          renderItem={AssetListItem}
          renderSectionFooter={() => <Separator />}
          renderSectionHeader={headerProps => <AssetListHeader {...headerProps} />}
          sections={[sections.balances]}
        />
      </FabWrapper>
    </Page>
  );
};

WalletScreen.propTypes = {
  accountInfo: PropTypes.object.isRequired,
  fetching: PropTypes.bool.isRequired,
  fetchingUniqueTokens: PropTypes.bool.isRequired,
  onPressProfile: PropTypes.func.isRequired,
  uniqueTokens: PropTypes.array.isRequired,
};

const reduxProps = ({ account }) => ({
  accountInfo: account.accountInfo,
  fetching: account.fetching,
  fetchingUniqueTokens: account.fetchingUniqueTokens,
  uniqueTokens: account.uniqueTokens,
});

export default compose(
  connect(reduxProps, null),
  withHandlers({
    onPressProfile: ({ navigation }) => () => navigation.navigate('SettingsScreen'),
  }),
)(WalletScreen);
