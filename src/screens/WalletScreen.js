import { withSafeTimeout } from '@hocs/safe-timers';
import { isSameDay } from 'date-fns';
import { get, join, map } from 'lodash';
import PropTypes from 'prop-types';
import { withAccountAssets } from '@rainbow-me/rainbow-common';
import React, { PureComponent } from 'react';
import { withNavigation, withNavigationFocus } from 'react-navigation';
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
    const {
      lolWTF,
      setSafeTimeout,
      toggleShowShitcoins,
    } = this.props;

    // setSafeTimeout(lolWTF, 500);

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

const lolPayloadData = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In dui purus, tempus at maximus a, semper a lacus. Nam convallis dui mauris, eget varius justo venenatis ut. Vestibulum dictum leo sed elementum malesuada. Etiam sed purus ipsum. Sed posuere augue a tincidunt cursus. In ac neque non tortor elementum bibendum rhoncus vel dolor. Duis tortor quam, tristique a ornare non, congue a tortor. Maecenas finibus dolor eu sodales ullamcorper. Ut imperdiet convallis vestibulum. Ut pretium lectus nec quam eleifend aliquam. Fusce nulla mauris, porta vitae aliquam quis, malesuada quis lectus. Quisque facilisis, lectus eget bibendum mollis, leo urna maximus sem, ac semper urna turpis eget magna. Pellentesque a consectetur orci. Cras consectetur ligula non posuere aliquet. Quisque at sem vel leo pharetra feugiat non sed velit. Fusce bibendum nisi turpis, nec porta magna scelerisque eget. Morbi consectetur, magna sit amet malesuada vulputate, nunc odio efficitur ex, vel bibendum mauris purus id nunc. Mauris suscipit dignissim consequat. In viverra, diam at interdum gravida, nulla elit tempor justo, a condimentum dolor ligula non lectus. Pellentesque pharetra in odio in rutrum. Donec mattis imperdiet libero ut elementum. Nam iaculis rhoncus nulla at tincidunt. Suspendisse potenti. Suspendisse pretium velit ut risus vehicula lobortis. Aliquam erat volutpat. Praesent turpis eros, varius nec eros in, consequat posuere enim. Aenean vehicula iaculis eleifend. Phasellus vitae mi a turpis suscipit interdum vitae vitae velit. Praesent mollis nulla nec nibh mollis, ac blandit augue laoreet. Pellentesque eget libero ut augue pellentesque imperdiet quis vitae sapien. Praesent orci nibh, aliquam vitae ultricies quis, interdum sed massa. Cras elit odio, accumsan eu elementum lobortis, rutrum a lacus. Proin tincidunt porttitor augue, et volutpat enim pellentesque sit amet. Aliquam hendrerit nisi eu sem gravida, quis pellentesque lectus luctus. Aenean nulla nunc, mattis ut ultricies non, bibendum vitae lorem. Pellentesque luctus at nunc mollis facilisis. Fusce lectus turpis, tempus ultrices pellentesque sed, consequat id lacus. Duis vitae dignissim leo. Interdum et malesuada fames ac ante ipsum primis in faucibus. Maecenas tempor efficitur purus quis rhoncus. Nullam aliquet tincidunt ipsum, ut sagittis lectus. Integer in orci augue. Praesent consequat, odio et ullamcorper congue, velit mi mattis mi, in efficitur justo sapien vitae mauris. Nam dictum imperdiet laoreet. Aliquam fringilla dolor in sodales convallis. Donec iaculis ipsum nec volutpat vehicula. Phasellus a fringilla urna. Suspendisse luctus ex urna, hendrerit facilisis eros porttitor id. Duis non maximus lectus, eu lobortis nulla. Donec feugiat massa eu tortor feugiat, nec venenatis augue facilisis.';

export default compose(
  withAccountAssets,
  withAccountRefresh,
  withAccountSettings,
  withFetchingPrices,
  withSafeTimeout,
  withNavigation,
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
    lolWTF: ({ navigation }) => () => {
      const item = {
        dappName: 'Mikes Dapp',
        transactionDisplayDetails: {
          payload: lolPayloadData,
            // asset:,
            // from: transaction.from,
            // gasLimit: BigNumber(convertHexToString(transaction.gasLimit)),
            // gasPrice: BigNumber(convertHexToString(transaction.gasPrice)),
            // nativeAmount,
            // nativeAmountDisplay,
            // nonce: Number(convertHexToString(transaction.nonce)),
            // to: toAddress,
            // value,


          // {
          //   data: lolPayloadData,
          //   from: '0x123456789',
          //   gasLimit: 2100,
          //   gasPrice: 2100,
          //   nonce: 500,
          //   to: '0x123456789',
          //   value: '0.1',
          // },
          timestampInMs: '123456789',
          type: 'message',
        },
      };

      return navigation.navigate({
        params: { transactionDetails: item },
        routeName: 'ConfirmRequest',
      });
    },
  }),
  withProps(buildWalletSectionsSelector),
)(WalletScreen);
