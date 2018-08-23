import lang from 'i18n-js';
import { get, groupBy, isNull } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { compose, onlyUpdateForKeys, withHandlers, withState } from 'recompact';
import { AssetList, UniqueTokenRow } from '../components/asset-list';
import { BalanceCoinRow } from '../components/coin-row';
import Avatar from '../components/Avatar';
import { ActivityHeaderButton, Header, HeaderButton } from '../components/header';
import { FlexItem, Page } from '../components/layout';
import { withHideSplashScreenOnMount } from '../hoc';
import { position } from '../styles';

const buildUniqueTokenList = (uniqueTokensAssets) => {
  const list = [];

  for (let i = 0; i < uniqueTokensAssets.length; i += 2) {
    list.push([uniqueTokensAssets[i], uniqueTokensAssets[i + 1]]);
  }

  return list;
};

const filterEmptyAssetSections = sections => sections.filter(({ totalItems }) => totalItems);

const groupAssetsByMarketValue = assets => groupBy(assets, ({ native }) => (
  isNull(native) ? 'noValue' : 'hasValue'
));

const sortAssetsByNativeAmount = (assets, showShitcoins) => {
  const assetsByMarketValue = groupAssetsByMarketValue(assets);

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
      data: sortAssetsByNativeAmount(accountInfo.assets, showShitcoins),
      renderItem: BalanceCoinRow,
      title: lang.t('account.tab_balances'),
      totalItems: get(accountInfo, 'total.amount') ? accountInfo.assets.length : 0,
      totalValue: get(accountInfo, 'total.display', ''),
    },
    collectibles: {
      data: buildUniqueTokenList(uniqueTokens),
      renderItem: UniqueTokenRow,
      title: lang.t('account.tab_collectibles'),
      totalItems: uniqueTokens.length,
      totalValue: '',
    },
  };

  const assetsByMarketValue = groupAssetsByMarketValue(accountInfo.assets);
  const totalShitcoins = get(assetsByMarketValue, 'noValue', []).length;
  if (totalShitcoins) {
    sections.balances.contextMenuOptions = {
      cancelButtonIndex: 1,
      destructiveButtonIndex: showShitcoins ? 0 : 99, // 99 is an arbitrarily high number used to disable the 'destructiveButton' option
      onPress: (index) => { if (index === 0) onToggleShowShitcoins(); },
      options: [
        `${showShitcoins ? lang.t('account.hide') : lang.t('account.show')} ${lang.t('wallet.assets.no_price')}`,
        lang.t('wallet.action.cancel'),
      ],
    };
  }

  return (
    <Page component={FlexItem} style={position.sizeAsObject('100%')}>
      <Header justify="space-between">
        <HeaderButton onPress={onPressProfile}>
          <Avatar />
        </HeaderButton>
        <ActivityHeaderButton />
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
  onlyUpdateForKeys(['isScreenActive', ...Object.keys(WalletScreen.propTypes)]),
)(WalletScreen);
