import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { ScrollView, SectionList } from 'react-native';
import styled from 'styled-components/primitives';
import {
  AssetListHeader,
  AssetListItem,
  BalanceCoinRow,
  UniqueTokenGridList,
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

const WalletScreen = ({ wallet: { assets = [] }, ...props }) => {
  const sections = {
    balances: {
      data: assets,
      key: 'balances',
      renderItem: BalanceCoinRow,
      title: 'Balances',
      totalValue: '456.60',
    },
    collectibles: {
      data: [['fake nft #1', 'fake nft #2', 'fake nft #3']],
      key: 'collectibles',
      renderItem: UniqueTokenGridList,
      title: 'Collectibles',
      totalValue: '26.32',
    },
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
          sections={[sections.balances, sections.collectibles]}
        />
      </Container>
    </FabWrapper>
  );
};

WalletScreen.propTypes = {
  loading: PropTypes.bool,
  wallet: PropTypes.object,
};

export default WalletScreen;
