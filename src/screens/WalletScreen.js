import { withSafeTimeout } from '@hocs/safe-timers';
import lang from 'i18n-js';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withHandlers, withState } from 'recompact';
import { AssetList } from '../components/asset-list';
import { UniqueTokenRow } from '../components/unique-token';
import Avatar from '../components/Avatar';
import { BalanceCoinRow } from '../components/coin-row';
import { ActivityHeaderButton, Header, HeaderButton } from '../components/header';
import { FlexItem, Page } from '../components/layout';
import {
  areAssetsEqualToInitialAccountAssetsState,
  buildUniqueTokenList,
  groupAssetsByMarketValue,
  sortAssetsByNativeAmount,
} from '../helpers/assets';
import {
  withAccountAddress,
  withAccountAssets,
  withHideSplashScreen,
  withRequestsInit,
} from '../hoc';
import { position } from '../styles';

const BalanceRenderItem = renderItemProps => <BalanceCoinRow {...renderItemProps} />;
const UniqueTokenRenderItem = renderItemProps => <UniqueTokenRow {...renderItemProps} />;
const filterEmptyAssetSections = sections => sections.filter(({ totalItems }) => totalItems);

const WalletScreen = ({
  assets,
  assetsCount,
  assetsTotalUSD,
  didLoadAssetList,
  fetching,
  onPressProfile,
  onPressWalletConnect,
  onRefreshList,
  onSectionsLoaded,
  onToggleShowShitcoins,
  showShitcoins,
  uniqueTokens,
}) => {
  const sections = {
    balances: {
      data: sortAssetsByNativeAmount(assets, showShitcoins),
      renderItem: BalanceRenderItem,
      title: lang.t('account.tab_balances'),
      totalItems: get(assetsTotalUSD, 'amount') ? assetsCount : 0,
      totalValue: get(assetsTotalUSD, 'display', ''),
    },
    collectibles: {
      data: buildUniqueTokenList(uniqueTokens),
      renderItem: UniqueTokenRenderItem,
      title: lang.t('account.tab_collectibles'),
      totalItems: uniqueTokens.length,
      totalValue: '',
    },
  };

  const assetsByMarketValue = groupAssetsByMarketValue(assets);
  const totalShitcoins = get(assetsByMarketValue, 'noValue', []).length;
  if (totalShitcoins) {
    // 99 is an arbitrarily high number used to disable the 'destructiveButton' option
    const destructiveButtonIndex = showShitcoins ? 0 : 99;

    sections.balances.contextMenuOptions = {
      cancelButtonIndex: 1,
      destructiveButtonIndex,
      onPress: onToggleShowShitcoins,
      options: [
        `${lang.t(`account.${showShitcoins ? 'hide' : 'show'}`)} ${lang.t('wallet.assets.no_price')}`,
        lang.t('wallet.action.cancel'),
      ],
    };
  }

  const filteredSections = filterEmptyAssetSections([sections.balances, sections.collectibles]);

  let isEmpty = !filteredSections.length;
  if (filteredSections.length === 1) {
    isEmpty = areAssetsEqualToInitialAccountAssetsState(filteredSections[0].data[0]);
  }

  return (
    <Page component={FlexItem} style={position.sizeAsObject('100%')}>
      <Header justify="space-between">
        <HeaderButton onPress={onPressProfile} transformOrigin="left">
          <Avatar />
        </HeaderButton>
        {(didLoadAssetList && !isEmpty) && <ActivityHeaderButton />}
      </Header>
      <AssetList
        fetchData={onRefreshList}
        isEmpty={isEmpty}
        onPressWalletConnect={onPressWalletConnect}
        onSectionsLoaded={onSectionsLoaded}
        sections={filteredSections}
        showShitcoins={showShitcoins}
      />
    </Page>
  );
};

WalletScreen.propTypes = {
  assets: PropTypes.array,
  assetsCount: PropTypes.number,
  assetsTotalUSD: PropTypes.shape({
    amount: PropTypes.string,
    display: PropTypes.string,
  }),
  didLoadAssetList: PropTypes.bool,
  fetching: PropTypes.bool.isRequired,
  fetchingUniqueTokens: PropTypes.bool.isRequired,
  onPressProfile: PropTypes.func.isRequired,
  onPressWalletConnect: PropTypes.func.isRequired,
  onRefreshList: PropTypes.func.isRequired,
  onSectionsLoaded: PropTypes.func,
  onToggleShowShitcoins: PropTypes.func,
  showShitcoins: PropTypes.bool,
  uniqueTokens: PropTypes.array.isRequired,
};

export default compose(
  withAccountAddress,
  withAccountAssets,
  withHideSplashScreen,
  withRequestsInit,
  withSafeTimeout,
  withState('didLoadAssetList', 'toggleLoadAssetList', false),
  withState('showShitcoins', 'toggleShowShitcoins', true),
  withHandlers({
    onPressProfile: ({ navigation }) => () => navigation.navigate('SettingsScreen'),
    onPressWalletConnect: ({ navigation }) => () => navigation.navigate('QRScannerScreen'),
    onRefreshList: ({
      accountAddress,
      accountUpdateAccountAddress,
      setSafeTimeout,
      transactionsToApproveInit,
    }) => () => {
      accountUpdateAccountAddress(accountAddress, 'BALANCEWALLET');
      transactionsToApproveInit();
      // hack: use timeout so that it looks like loading is happening
      // accountUpdateAccountAddress does not return a promise
      return new Promise(resolve => setSafeTimeout(resolve, 2000));
    },
    onSectionsLoaded: ({ didLoadAssetList, onHideSplashScreen, toggleLoadAssetList }) => () => {
      if (!didLoadAssetList) {
        onHideSplashScreen();
        toggleLoadAssetList(true);
      }
    },
    onToggleShowShitcoins: ({ showShitcoins, toggleShowShitcoins }) => (index) => {
      if (index === 0) {
        toggleShowShitcoins(!showShitcoins);
      }
    },
  }),
  onlyUpdateForKeys(['isScreenActive', ...Object.keys(WalletScreen.propTypes)]),
)(WalletScreen);
