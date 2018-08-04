import { get, groupBy, isNull } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers, withState } from 'recompact';
import { AssetList, BalanceCoinRow, UniqueTokenGridList } from '../components/asset-list';
import Avatar from '../components/Avatar';
import { Header, HeaderButton } from '../components/header';
import { Page } from '../components/layout';
import { withHideSplashScreenOnMount } from '../hoc';

const filterEmptyAssetSections = sections => sections.filter(({ totalItems }) => totalItems);

const sortAssetsByNativeAmount = (assets, showShitcoins) => {
  const assetsByMarketValue = groupBy(assets, ({ native }) => (
    isNull(native) ? 'noValue' : 'hasValue'
  ));

  const sortedAssetsWithMarketValue = (assetsByMarketValue.hasValue || []).sort((a, b) => {
    const amountA = get(a, 'native.balance.amount', 0);
    const amountB = get(b, 'native.balance.amount', 0);
    return parseFloat(amountB) - parseFloat(amountA);
  });

  if (showShitcoins) {
    const sortedAssetsWithNoMarketValue = (assetsByMarketValue.noValue || []).sort((a, b) => (
      (a.name < b.name) ? -1 : 1
    ));

    return sortedAssetsWithMarketValue.concat(sortedAssetsWithNoMarketValue);
  }

  return sortedAssetsWithMarketValue;
};

const WalletScreen = ({
  accountInfo,
  onPressProfile,
  onPressWalletConnect,
  onToggleShowShitcoins,
  showShitcoins,
  uniqueTokens,
}) => {
  const sections = {
    balances: {
      contextMenuOptions: {
        cancelButtonIndex: 1,
        destructiveButtonIndex: showShitcoins ? 0 : 99, // 99 is an arbitrarily high number used to disable the 'destructiveButton' option
        onPress: (index) => { if (index === 0) onToggleShowShitcoins(); },
        options: [`${showShitcoins ? 'Hide' : 'Show'} assets w/ no price data`, 'Cancel'],
      },
      data: sortAssetsByNativeAmount(accountInfo.assets, showShitcoins),
      renderItem: BalanceCoinRow,
      title: 'Balances',
      totalItems: (!!Number(accountInfo.total.amount)) ? accountInfo.assets.length : 0,
      totalValue: accountInfo.total.display || '',
    },
    collectibles: {
      data: [uniqueTokens],
      renderItem: UniqueTokenGridList,
      title: 'Collectibles',
      totalItems: uniqueTokens.length,
      totalValue: '',
    },
  };

  return (
    <Page>
      <Header>
        <HeaderButton onPress={onPressProfile}>
          <Avatar />
        </HeaderButton>
      </Header>
      <AssetList
        onPressWalletConnect={onPressWalletConnect}
        sections={filterEmptyAssetSections([sections.balances, sections.collectibles])}
        showShitcoins={showShitcoins}
      />
    </Page>
  );
};

WalletScreen.propTypes = {
  accountInfo: PropTypes.object.isRequired,
  fetching: PropTypes.bool.isRequired,
  fetchingUniqueTokens: PropTypes.bool.isRequired,
  onPressProfile: PropTypes.func.isRequired,
  onPressWalletConnect: PropTypes.func.isRequired,
  onToggleShowShitcoins: PropTypes.func,
  showShitcoins: PropTypes.bool,
  uniqueTokens: PropTypes.array.isRequired,
};

const reduxProps = ({ account }) => ({
  accountInfo: account.accountInfo,
  fetching: account.fetching,
  fetchingUniqueTokens: account.fetchingUniqueTokens,
  uniqueTokens: account.uniqueTokens,
});

export default compose(
  withHideSplashScreenOnMount,
  withState('showShitcoins', 'toggleShowShitcoins', true),
  connect(reduxProps, null),
  withHandlers({
    onPressProfile: ({ navigation }) => () => navigation.navigate('SettingsScreen'),
    onPressWalletConnect: ({ navigation }) => () => navigation.navigate('QRScannerScreen'),
    onToggleShowShitcoins: ({ showShitcoins, toggleShowShitcoins }) => () => toggleShowShitcoins(!showShitcoins),
  }),
)(WalletScreen);
