import { get, map, property } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Animated from 'react-native-reanimated';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { compose, mapProps, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { withUniswapAssets } from '../hoc';
import { borders, colors, position } from '../styles';
import { isNewValueForPath } from '../utils';
import { filterList } from '../utils/search';
import { EmptyAssetList } from '../components/asset-list';
import { ExchangeCoinRow } from '../components/coin-row';
import { ExchangeAssetList, ExchangeSearch } from '../components/exchange';
import GestureBlocker from '../components/GestureBlocker';
import { BackButton } from '../components/header';
import {
  Centered,
  Column,
  FlexItem,
  KeyboardFixedOpenLayout,
} from '../components/layout';
import { Modal } from '../components/modal';
import { TruncatedText } from '../components/text';
import { exchangeModalBorderRadius } from './ExchangeModal';

const EMPTY_ARRAY = [];

const BackButtonWrapper = styled(Centered)`
  left: 0;
  margin-left: 15;
  position: absolute;
`;

const HeaderContainer = styled(Centered).attrs({ flex: 0 })`
  ${borders.buildRadius('top', 12)};
  background-color: ${colors.white};
  height: 60;
  width: 100%;
`;

const HeaderTitle = withProps({
  height: 21,
  letterSpacing: 'tighter',
  lineHeight: 'loose',
  size: 'large',
  weight: 'bold',
})(TruncatedText);

const appendAssetWithSearchableKey = asset => ({
  ...asset,
  uniqueId: `${asset.name} ${asset.symbol}`,
});

const buildUniqueIdForListData = (items = EMPTY_ARRAY) =>
  items.map(property('address')).join('_');

const normalizeAssetItems = assetsArray =>
  map(assetsArray, appendAssetWithSearchableKey);

export const CurrencySelectionTypes = {
  input: 'input',
  output: 'output',
};

class CurrencySelectModal extends Component {
  static propTypes = {
    assetsAvailableOnUniswap: PropTypes.arrayOf(PropTypes.object),
    isFocused: PropTypes.bool,
    navigation: PropTypes.object,
    sortedUniswapAssets: PropTypes.array,
    transitionPosition: PropTypes.object,
    type: PropTypes.oneOf(Object.keys(CurrencySelectionTypes)),
  };

  state = {
    searchQuery: '',
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    let currentAssets = this.props.sortedUniswapAssets;
    let nextAssets = EMPTY_ARRAY;

    if (nextProps.type === CurrencySelectionTypes.input) {
      currentAssets = this.props.assetsAvailableOnUniswap;
      nextAssets = nextProps.assetsAvailableOnUniswap;
    } else if (nextProps.type === CurrencySelectionTypes.output) {
      nextAssets = nextProps.sortedUniswapAssets;
    }

    const currentAssetsUniqueId = buildUniqueIdForListData(currentAssets);
    const nextAssetsUniqueId = buildUniqueIdForListData(nextAssets);

    const isNewAssets = currentAssetsUniqueId !== nextAssetsUniqueId;
    const isNewFocus = isNewValueForPath(this.props, nextProps, 'isFocused');
    const isNewSearchQuery = isNewValueForPath(
      this.state,
      nextState,
      'searchQuery'
    );
    const isNewType = isNewValueForPath(this.props, nextProps, 'type');

    return isNewAssets || isNewFocus || isNewSearchQuery || isNewType;
  };

  dangerouslySetIsGestureBlocked = isGestureBlocked => {
    // dangerouslyGetParent is a bad pattern in general, but in this case is exactly what we expect
    this.props.navigation
      .dangerouslyGetParent()
      .setParams({ isGestureBlocked });
  };

  handleChangeSearchText = searchQuery => {
    this.setState({ searchQuery });
  };

  handlePressBack = () => {
    this.props.navigation.navigate('MainExchangeScreen');
  };

  handleSelectAsset = item => {
    const { navigation } = this.props;
    // It's a bit weird and I'm not sure why on invoking
    // navigation.getParam('onSelectCurrency')(item)
    // but this small hack seems to be a legit workaround
    const onSelectCurrency = navigation.getParam('onSelectCurrency');
    onSelectCurrency(item);
    navigation.navigate('MainExchangeScreen');
  };

  handleWillBlur = () => this.dangerouslySetIsGestureBlocked(false);

  handleWillFocus = () => {
    this.dangerouslySetIsGestureBlocked(true);
    if (this.searchInputRef.current) {
      this.searchInputRef.current.focus();
    }
  };

  renderCurrencyItem = item => (
    <ExchangeCoinRow
      item={item}
      onPress={this.handleSelectAsset}
      uniqueId={item.uniqueId}
    />
  );

  searchInputRef = React.createRef();

  render = () => {
    const {
      assetsAvailableOnUniswap,
      isFocused,
      sortedUniswapAssets,
      transitionPosition,
      type,
    } = this.props;

    const { searchQuery } = this.state;

    let headerTitle = '';
    let assets = sortedUniswapAssets;
    if (type === CurrencySelectionTypes.input) {
      headerTitle = 'Swap';
      assets = assetsAvailableOnUniswap;
    } else if (type === CurrencySelectionTypes.output) {
      headerTitle = 'Receive';
    }

    const listItems = filterList(assets, searchQuery, 'uniqueId');

    const isLoading = !isFocused || listItems.length === 0;

    return (
      <KeyboardFixedOpenLayout>
        <Animated.View
          style={{
            ...position.sizeAsObject('100%'),
            opacity: Animated.interpolate(transitionPosition, {
              extrapolate: 'clamp',
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          }}
        >
          <Modal
            containerPadding={0}
            height="100%"
            overflow="hidden"
            radius={exchangeModalBorderRadius}
          >
            <GestureBlocker type="top" />
            <NavigationEvents
              onWillBlur={this.handleWillBlur}
              onWillFocus={this.handleWillFocus}
            />
            <Column flex={1}>
              <HeaderContainer>
                <BackButtonWrapper>
                  <BackButton
                    color={colors.black}
                    direction="left"
                    onPress={this.handlePressBack}
                    size="9"
                  />
                </BackButtonWrapper>
                <HeaderTitle>{headerTitle}</HeaderTitle>
              </HeaderContainer>
              <ExchangeSearch
                autoFocus={false}
                onChangeText={this.handleChangeSearchText}
                ref={this.searchInputRef}
                searchQuery={searchQuery}
              />
              <FlexItem>
                {isFocused ? (
                  <ExchangeAssetList
                    key={`ExchangeAssetListCurrencySelectionModal-${type}`}
                    items={listItems}
                    renderItem={this.renderCurrencyItem}
                    scrollIndicatorInsets={{
                      bottom: exchangeModalBorderRadius,
                    }}
                  />
                ) : null}
                <EmptyAssetList
                  {...position.coverAsObject}
                  backgroundColor={colors.white}
                  opacity={isLoading ? 1 : 0}
                  pointerEvents="none"
                />
              </FlexItem>
            </Column>
            <GestureBlocker type="bottom" />
          </Modal>
        </Animated.View>
      </KeyboardFixedOpenLayout>
    );
  };
}

export default compose(
  withNavigationFocus,
  withUniswapAssets,
  mapProps(
    ({
      assetsAvailableOnUniswap,
      navigation,
      sortedUniswapAssets,
      ...props
    }) => ({
      ...props,
      assetsAvailableOnUniswap: normalizeAssetItems(assetsAvailableOnUniswap),
      navigation,
      sortedUniswapAssets: normalizeAssetItems(sortedUniswapAssets),
      transitionPosition: get(navigation, 'state.params.position'),
      type: get(navigation, 'state.params.type', null),
    })
  )
)(CurrencySelectModal);
