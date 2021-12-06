import React, { Fragment } from 'react';
import { LayoutAnimation } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { View } from 'react-primitives';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';

import styled from 'styled-components';
import { buildCoinsList } from '../../helpers/assets';
import networkTypes from '../../helpers/networkTypes';
import { deviceUtils } from '../../utils';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider, { DividerSize } from '../Divider';
import { FlyInAnimation } from '../animations';
import { CoinDividerOpenButton } from '../coin-divider';
import {
  CollectiblesSendRow,
  SendCoinRow,
  SendSavingsCoinRow,
} from '../coin-row';
import { Centered } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../savings/SavingsListHeader' was resolved... Remove this comment to see the full error message
import SavingsListHeader from '../savings/SavingsListHeader';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../token-family/TokenFamilyHeader' was res... Remove this comment to see the full error message
import TokenFamilyHeader from '../token-family/TokenFamilyHeader';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';

const dividerMargin = 5;
const dividerHeight = DividerSize + dividerMargin * 4;
const familyRowHeight = 59;
const familyHeaderHeight = 49;
const rowHeight = 59;
const smallBalancesHeader = 42;

const SendAssetListCoinDividerOpenButton = styled(CoinDividerOpenButton).attrs({
  coinDividerHeight: 34,
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-left: ${android ? 0 : 19};
`;

const SendAssetRecyclerListView = styled(RecyclerListView)`
  min-height: 1;
`;

const SendAssetListDivider = () => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered marginVertical={dividerMargin}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Divider color={colors.rowDividerExtraLight} />
    </Centered>
  );
};

export default class SendAssetList extends React.Component {
  _layoutProvider: any;
  componentHeight: any;
  data: any;
  position: any;
  constructor(props: any) {
    super(props);

    const {
      allAssets,
      hiddenCoins,
      nativeCurrency,
      network,
      pinnedCoins,
      savings,
      uniqueTokens,
    } = props;

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 7 arguments, but got 5.
    const { assets } = buildCoinsList(
      allAssets,
      nativeCurrency,
      true,
      pinnedCoins,
      hiddenCoins
    );

    let smallBalances = [];
    let shitcoins: any = [];

    if (assets[assets.length - 1].smallBalancesContainer) {
      smallBalances = assets.pop();
      shitcoins = smallBalances.assets;
    }

    if (assets[assets.length - 1].coinDivider) {
      assets.pop(); // removes not needed coin divider
    }

    const visibleAssetsLength = assets.length;

    this.data = assets;

    if (smallBalances.assets.length > 0) {
      //check for placeholder ETH & remove
      smallBalances.assets = smallBalances.assets.filter(
        (asset: any) => !asset?.isPlaceholder
      );
      this.data.push(smallBalances);
    }

    if (savings && savings.length > 0 && network === networkTypes.mainnet) {
      this.data = this.data.concat([{ data: savings, name: 'Savings' }]);
    }
    if (uniqueTokens && uniqueTokens.length > 0) {
      this.data = this.data.concat(uniqueTokens);
    }
    this.state = {
      dataProvider: new DataProvider((r1, r2) => {
        return r1 !== r2;
      }).cloneWithRows(this.data),
      openCards: [],
      openSavings: true,
      openShitcoins: false,
      visibleAssetsLength: visibleAssetsLength,
    };

    const imageTokens: any = [];
    uniqueTokens.forEach((family: any) => {
      family.data.forEach((token: any) => {
        if (token.image_thumbnail_url) {
          imageTokens.push({
            id: token.id,
            uri: token.image_thumbnail_url,
          });
        }
      });
    });

    ImgixImage.preload(imageTokens, 45);

    this._layoutProvider = new LayoutProvider(
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '(i: number) => "COIN_ROW" | "COI... Remove this comment to see the full error message
      i => {
        if (i < visibleAssetsLength - 1) {
          return 'COIN_ROW';
        } else if (i === visibleAssetsLength - 1) {
          return (savings && savings.length !== 0) ||
            (shitcoins && shitcoins.length !== 0)
            ? 'COIN_ROW'
            : 'COIN_ROW_LAST';
        } else if (
          i === visibleAssetsLength &&
          shitcoins &&
          shitcoins.length > 0
        ) {
          return {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'openShitcoins' does not exist on type 'R... Remove this comment to see the full error message
            size: this.state.openShitcoins ? rowHeight * shitcoins.length : 0,
            type: 'SHITCOINS_ROW',
          };
        } else if (
          (i === visibleAssetsLength ||
            (i === visibleAssetsLength + 1 &&
              shitcoins &&
              shitcoins.length > 0)) &&
          savings &&
          savings.length > 0
        ) {
          return {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'openSavings' does not exist on type 'Rea... Remove this comment to see the full error message
            size: this.state.openSavings ? rowHeight * savings.length : 0,
            type: 'SAVINGS_ROW',
          };
        } else {
          if (
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'openCards' does not exist on type 'Reado... Remove this comment to see the full error message
            this.state.openCards[
              uniqueTokens[
                i -
                  visibleAssetsLength -
                  (savings && savings.length > 0 ? 1 : 0) -
                  (shitcoins && shitcoins.length > 0 ? 1 : 0)
              ].familyId
            ]
          ) {
            return {
              size:
                uniqueTokens[
                  i -
                    visibleAssetsLength -
                    (savings && savings.length > 0 ? 1 : 0) -
                    (shitcoins && shitcoins.length > 0 ? 1 : 0)
                ].data.length + 1,
              type: 'COLLECTIBLE_ROW',
            };
          } else {
            return 'COLLECTIBLE_ROW_CLOSED';
          }
        }
      },
      (type, dim) => {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
        dim.width = deviceUtils.dimensions.width;
        if (type === 'COIN_ROW') {
          dim.height = rowHeight;
        } else if (type === 'COIN_ROW_LAST') {
          dim.height = rowHeight + dividerHeight;
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type 'string | n... Remove this comment to see the full error message
        } else if (type.type === 'SHITCOINS_ROW') {
          dim.height =
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type 'string | n... Remove this comment to see the full error message
            type.size +
            smallBalancesHeader +
            (savings && savings.length > 0 ? 0 : dividerHeight);
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type 'string | n... Remove this comment to see the full error message
        } else if (type.type === 'SAVINGS_ROW') {
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type 'string | n... Remove this comment to see the full error message
          dim.height = type.size + familyHeaderHeight + dividerHeight;
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type 'string | n... Remove this comment to see the full error message
        } else if (type.type === 'COLLECTIBLE_ROW') {
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type 'string | n... Remove this comment to see the full error message
          dim.height = familyHeaderHeight + (type.size - 1) * familyRowHeight;
        } else if (type === 'COLLECTIBLE_ROW_CLOSED') {
          dim.height = familyHeaderHeight;
        } else {
          dim.height = 0;
        }
      }
    );
  }

  rlv = React.createRef();

  handleRef = (ref: any) => {
    this.rlv = ref;
  };

  handleScroll = ({ nativeEvent }: any) => {
    this.componentHeight = nativeEvent?.layoutMeasurement?.height;
    this.position = nativeEvent?.contentOffset?.y;
  };

  changeOpenTab = (index: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'allAssets' does not exist on type 'Reado... Remove this comment to see the full error message
    const { allAssets, savings, uniqueTokens } = this.props;
    const {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'openCards' does not exist on type 'Reado... Remove this comment to see the full error message
      openCards,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'openSavings' does not exist on type 'Rea... Remove this comment to see the full error message
      openSavings,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'openShitcoins' does not exist on type 'R... Remove this comment to see the full error message
      openShitcoins,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'visibleAssetsLength' does not exist on t... Remove this comment to see the full error message
      visibleAssetsLength,
    } = this.state;

    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
    openCards[index] = !openCards[index];
    this.setState({ openCards });
    let familiesHeight = 0;
    if (openCards[index]) {
      for (let i = 0; i < index; i++) {
        if (openCards[i]) {
          familiesHeight +=
            familyHeaderHeight + uniqueTokens[i].data.length * familyRowHeight;
        } else {
          familiesHeight += familyHeaderHeight;
        }
      }
      const smallBalancesheight =
        allAssets.length === visibleAssetsLength
          ? 0
          : smallBalancesHeader +
            (openShitcoins
              ? (allAssets.length - visibleAssetsLength) * rowHeight
              : 0);
      const savingsHeight =
        savings?.length > 0
          ? familyHeaderHeight + (openSavings ? savings.length * rowHeight : 0)
          : 0;
      const heightBelow =
        visibleAssetsLength * rowHeight +
        smallBalancesheight +
        savingsHeight +
        familiesHeight +
        dividerHeight;
      const renderSize =
        familyHeaderHeight + uniqueTokens[index].data.length * familyRowHeight;
      const screenHeight = this.position + this.componentHeight;
      if (heightBelow + renderSize + rowHeight > screenHeight) {
        if (renderSize < this.componentHeight) {
          setTimeout(() => {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'scrollToOffset' does not exist on type '... Remove this comment to see the full error message
            this.rlv.scrollToOffset(
              0,
              this.position +
                (heightBelow + renderSize - screenHeight + familyHeaderHeight),
              true
            );
          }, 10);
        } else {
          setTimeout(() => {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'scrollToOffset' does not exist on type '... Remove this comment to see the full error message
            this.rlv.scrollToOffset(
              0,
              this.position - (this.position - heightBelow),
              true
            );
          }, 10);
        }
      }
    }
  };

  changeOpenSavings = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'openSavings' does not exist on type 'Rea... Remove this comment to see the full error message
    this.setState(prevState => ({ openSavings: !prevState.openSavings }));
  };

  changeOpenShitcoins = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'openShitcoins' does not exist on type 'R... Remove this comment to see the full error message
    this.setState(prevState => ({ openShitcoins: !prevState.openShitcoins }));
  };

  mapTokens = (collectibles: any) =>
    collectibles.map((collectible: any) => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <CollectiblesSendRow
        item={collectible}
        key={collectible.id}
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'onSelectAsset' does not exist on type 'R... Remove this comment to see the full error message
        onPress={() => this.props.onSelectAsset(collectible)}
        testID="send-collectible"
      />
    ));

  balancesRenderItem = (item: any) => (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SendCoinRow
      {...item}
      key={item.uniqueId}
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'onSelectAsset' does not exist on type 'R... Remove this comment to see the full error message
      onPress={() => this.props.onSelectAsset(item)}
      rowHeight={rowHeight}
      testID="send-asset"
    />
  );

  mapSavings = (savings: any) =>
    savings.map((token: any) => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <SendSavingsCoinRow
        item={token}
        key={token.address}
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'onSelectAsset' does not exist on type 'R... Remove this comment to see the full error message
        onPress={() => this.props.onSelectAsset(token)}
        testID="send-savings"
      />
    ));

  mapShitcoins = (shitcoins: any) =>
    shitcoins.map((token: any) => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <SendCoinRow
        key={token.uniqueId}
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'onSelectAsset' does not exist on type 'R... Remove this comment to see the full error message
        onPress={() => this.props.onSelectAsset(token)}
        rowHeight={rowHeight}
        testID="send-shitcoin"
        top={0}
        {...token}
      />
    ));

  balancesRenderLastItem = (item: any) => (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SendCoinRow
        {...item}
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'onSelectAsset' does not exist on type 'R... Remove this comment to see the full error message
        onPress={() => this.props.onSelectAsset(item)}
        rowHeight={rowHeight}
        testID="send-asset"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SendAssetListDivider />
    </Fragment>
  );

  collectiblesRenderItem = (item: any) => {
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <TokenFamilyHeader
          childrenAmount={item.data.length}
          familyImage={item.familyImage}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'openCards' does not exist on type 'Reado... Remove this comment to see the full error message
          isOpen={this.state.openCards[item.familyId]}
          onPress={() => {
            this.changeOpenTab(item.familyId);
          }}
          testID={`${item.name}-family-header`}
          title={item.name}
        />
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'openCards' does
        not exist on type 'Reado... Remove this comment to see the full error
        message
        {this.state.openCards[item.familyId] && this.mapTokens(item.data)}
      </View>
    );
  };

  savingsRenderItem = (item: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'openSavings' does not exist on type 'Rea... Remove this comment to see the full error message
    const { openSavings } = this.state;
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <View marginTop={dividerMargin}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SavingsListHeader
          isOpen={openSavings}
          onPress={this.changeOpenSavings}
        />
        {openSavings && this.mapSavings(item.data)}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SendAssetListDivider />
      </View>
    );
  };

  shitcoinsRenderItem = (item: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'savings' does not exist on type 'Readonl... Remove this comment to see the full error message
    const { savings } = this.props;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'openShitcoins' does not exist on type 'R... Remove this comment to see the full error message
    const { openShitcoins } = this.state;
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <View marginTop={dividerMargin}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SendAssetListCoinDividerOpenButton
          isSendSheet
          isSmallBalancesOpen={openShitcoins}
          onPress={this.changeOpenShitcoins}
        />
        {openShitcoins && this.mapShitcoins(item.assets)}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        {savings && savings.length > 0 ? null : <SendAssetListDivider />}
      </View>
    );
  };

  renderRow = (type: any, data: any) => {
    if (type === 'COIN_ROW') {
      return this.balancesRenderItem(data);
    } else if (type === 'COIN_ROW_LAST') {
      return this.balancesRenderLastItem(data);
    } else if (type.type === 'SHITCOINS_ROW') {
      return this.shitcoinsRenderItem(data);
    } else if (type.type === 'SAVINGS_ROW') {
      return this.savingsRenderItem(data);
    } else if (type.type === 'COLLECTIBLE_ROW') {
      return this.collectiblesRenderItem(data);
    } else if (type === 'COLLECTIBLE_ROW_CLOSED') {
      return this.collectiblesRenderItem(data);
    }
    return null;
  };

  render() {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'dataProvider' does not exist on type 'Re... Remove this comment to see the full error message
    const { dataProvider, openShitcoins } = this.state;

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <FlyInAnimation>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SendAssetRecyclerListView
          dataProvider={dataProvider}
          disableRecycling
          extendedState={{ openShitcoins }}
          layoutProvider={this._layoutProvider}
          onScroll={this.handleScroll}
          ref={this.handleRef}
          rowRenderer={this.renderRow}
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
          testID="send-asset-list"
        />
      </FlyInAnimation>
    );
  }
}
