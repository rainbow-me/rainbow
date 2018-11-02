import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { Animated } from 'react-native';
import { BlurView } from 'react-native-blur';
import { compose, onlyUpdateForKeys, withHandlers, withState } from 'recompact';
import { get } from 'lodash';
import { withSafeTimeout } from '@hocs/safe-timers';
import Avatar from '../components/Avatar';
import { ActivityHeaderButton, Header, HeaderButton } from '../components/header';
import { AssetList } from '../components/asset-list';
import { BalanceCoinRow } from '../components/coin-row';
import { FlexItem, Page } from '../components/layout';
import { UniqueTokenRow } from '../components/unique-token';
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
  withTransitionProps,
} from '../hoc';
import { position } from '../styles';
import { FabWrapper, WalletConnectFab, SendFab } from '../components/fab';

const overlayStyles = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1,
};

const filterEmptyAssetSections = sections => sections.filter(({ totalItems }) => totalItems);

const WalletScreen = ({
  assets,
  assetsCount,
  assetsTotalUSD,
  didLoadAssetList,
  fetching,
  navigation,
  onPressSend,
  onPressProfile,
  onPressWalletConnect,
  onRefreshList,
  onSectionsLoaded,
  onToggleShowShitcoins,
  showShitcoins,
  transitionProps,
  uniqueTokens,
}) => {
  const sections = {
    balances: {
      data: sortAssetsByNativeAmount(assets, showShitcoins),
      renderItem: (renderItemProps) => (
        <BalanceCoinRow
          {...renderItemProps}
          onPress={(symbol) => navigation.navigate('ExpandedAssetScreen', { type: 'token', name: symbol })}
        />
      ),
      title: lang.t('account.tab_balances'),
      totalItems: get(assetsTotalUSD, 'amount') ? assetsCount : 0,
      totalValue: get(assetsTotalUSD, 'display', ''),
    },
    collectibles: {
      data: buildUniqueTokenList(uniqueTokens),
      renderItem: (renderItemProps) => (
        <UniqueTokenRow
          {...renderItemProps}
          onPress={(name) => navigation.navigate('ExpandedAssetScreen', { type: 'unique_token', name })}
        />
      ),
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

  const fabItems = [
    <SendFab disable={isEmpty} key="sendFab" onPress={onPressSend} />,
    <WalletConnectFab disable={isEmpty} key="walletConnectFab" onPress={onPressWalletConnect} />,
  ];

  const showBlur = transitionProps.effect === 'expanded' && (transitionProps.isTransitioning || transitionProps.position._value > 0);

  return (
    <Page component={FlexItem} style={position.sizeAsObject('100%')}>
      {showBlur ? (
        <Animated.View style={{ ...overlayStyles, opacity: transitionProps.position }}>
          <BlurView style={overlayStyles} blurAmount={5} blurType="dark" />
        </Animated.View>
      ) : null}
      <Header justify="space-between">
        <HeaderButton onPress={onPressProfile} transformOrigin="left">
          <Avatar />
        </HeaderButton>
        {(didLoadAssetList && !isEmpty) && <ActivityHeaderButton />}
      </Header>
      <FlexItem>
        <FabWrapper items={fabItems}>
          <AssetList
            fetchData={onRefreshList}
            isEmpty={isEmpty}
            onPressSend={onPressSend}
            onPressWalletConnect={onPressWalletConnect}
            onSectionsLoaded={onSectionsLoaded}
            sections={filteredSections}
            showShitcoins={showShitcoins}
          />
        </FabWrapper>
      </FlexItem>
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
  navigation: PropTypes.object,
  onPressProfile: PropTypes.func.isRequired,
  onPressSend: PropTypes.func.isRequired,
  onPressWalletConnect: PropTypes.func.isRequired,
  onRefreshList: PropTypes.func.isRequired,
  onSectionsLoaded: PropTypes.func,
  onToggleShowShitcoins: PropTypes.func,
  showShitcoins: PropTypes.bool,
  transitionProps: PropTypes.object,
  uniqueTokens: PropTypes.array.isRequired,
};

export default compose(
  withAccountAddress,
  withAccountAssets,
  withHideSplashScreen,
  withRequestsInit,
  withSafeTimeout,
  withTransitionProps,
  withState('didLoadAssetList', 'toggleLoadAssetList', false),
  withState('showShitcoins', 'toggleShowShitcoins', true),
  withHandlers({
    onPressSend: ({ navigation }) => () => navigation.navigate('SendScreen'),
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
