import { isSameDay } from 'date-fns';
import { get, join, map } from 'lodash';
import PropTypes from 'prop-types';
import { withAccountAssets } from '@rainbow-me/rainbow-common';
import React, { PureComponent } from 'react';
import { withNavigationFocus } from 'react-navigation';
import {
  compose,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import { AssetList } from '../components/asset-list';
import BlurOverlay from '../components/BlurOverlay';
import { FabWrapper } from '../components/fab';
import { CameraHeaderButton, Header, ProfileHeaderButton } from '../components/header';
import { Page } from '../components/layout';
import buildWalletSectionsSelector from '../helpers/buildWalletSections';
import { getShowShitcoinsSetting, updateShowShitcoinsSetting } from '../model/localstorage';
import {
  withAccountRefresh,
  withAccountSettings,
  withBlurTransitionProps,
  withFetchingPrices,
  withIsWalletEmpty,
} from '../hoc';
import { position } from '../styles';
import withStatusBarStyle from '../hoc/withStatusBarStyle';

class WalletScreen extends PureComponent {
  static propTypes = {
    allAssetsCount: PropTypes.number,
    assets: PropTypes.array,
    assetsTotal: PropTypes.object,
    blurOpacity: PropTypes.object,
    isEmpty: PropTypes.bool.isRequired,
    isFocused: PropTypes.bool,
    navigation: PropTypes.object,
    onRefreshList: PropTypes.func.isRequired,
    refreshAccount: PropTypes.func,
    sections: PropTypes.array,
    showBlur: PropTypes.bool,
    toggleShowShitcoins: PropTypes.func,
    uniqueTokens: PropTypes.array,
  }

  componentDidMount = async () => {
    const { toggleShowShitcoins } = this.props;

    try {
      const showShitcoins = await getShowShitcoinsSetting();
      if (showShitcoins !== null) {
        toggleShowShitcoins(showShitcoins);
      }
    } catch (error) {
      // TODO
    }
  }

  render = () => {
    const {
      blurOpacity,
      isEmpty,
      navigation,
      onRefreshList,
      sections,
      showBlur,
    } = this.props;

    return (
      <Page style={{ flex: 1, ...position.sizeAsObject('100%') }}>
        <Header justify="space-between">
          <ProfileHeaderButton navigation={navigation} />
          <CameraHeaderButton navigation={navigation} />
        </Header>
        <FabWrapper disabled={isEmpty}>
          <AssetList
            fetchData={onRefreshList}
            isEmpty={isEmpty}
            sections={sections}
          />
        </FabWrapper>
        {showBlur && <BlurOverlay opacity={blurOpacity} />}
      </Page>
    );
  }
}

export default compose(
  withAccountAssets,
  withAccountRefresh,
  withAccountSettings,
  withFetchingPrices,
  withNavigationFocus,
  withBlurTransitionProps,
  withIsWalletEmpty,
  withStatusBarStyle('dark-content'),
  withState('showShitcoins', 'toggleShowShitcoins', true),
  withHandlers({
    onRefreshList: ({ refreshAccount }) => async () => refreshAccount(),
    onToggleShowShitcoins: ({ showShitcoins, toggleShowShitcoins }) => (index) => {
      if (index === 0) {
        const updatedShowShitcoinsSetting = !showShitcoins;
        toggleShowShitcoins(updatedShowShitcoinsSetting);
        updateShowShitcoinsSetting(updatedShowShitcoinsSetting);
      }
    },
  }),
  withProps(buildWalletSectionsSelector),
)(WalletScreen);
