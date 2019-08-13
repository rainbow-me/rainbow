import {
  get,
} from 'lodash';
import PropTypes from 'prop-types';
import React, { Component, PureComponent } from 'react';
import { compose } from 'recompact';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { ReText } from 'react-native-redash';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import {
  Centered,
  Column,
  FlexItem,
  KeyboardFixedOpenLayout,
  Row,
} from '../components/layout';
import { safeAreaInsetValues } from '../utils';
import { Modal } from '../components/modal';
import { ExchangeCoinRow } from '../components/coin-row';
import GestureBlocker from '../components/GestureBlocker';
import { TruncatedText } from '../components/text';
import {
  withKeyboardFocusHistory,
  withTransitionProps,
} from '../hoc';
import { borders, colors, position } from '../styles';
import { EmptyAssetList } from '../components/asset-list';
import { BackButton } from '../components/header';
import { ExchangeAssetList, ExchangeSearch } from '../components/exchange';
import { filterList } from '../utils/search';
import { exchangeModalBorderRadius } from './ExchangeModal';

const HeaderContainer = styled(Centered).attrs({
  flex: 0,
})`
  ${borders.buildRadius('top', 12)};
  background-color: ${colors.white};
  height: 60;
  width: 100%;
`;

const BackButtonWrapper = styled(Centered)`
  left: 0;
  margin-left: 15;
  position: absolute;
`;

const appendAssetWithSearchableKey = (asset) => ({
  ...asset,
  uniqueId: `${asset.name} ${asset.symbol}`,
});

class CurrencySelectModal extends PureComponent { //Component {
  static propTypes = {
    navigation: PropTypes.object,
  }

  state = {
    assets: [],
    searchResults: [],
  }

  headerTitle = 'Receive'

  position = undefined

  onChangeSearchText = (searchPhrase) => {
    const searchResults = filterList(this.state.assets, searchPhrase, 'uniqueId');
    this.setState({ searchResults });
  }

  searchInputRef = React.createRef()

  componentDidMount() {
    this.getDataFromParams();
  }

  componentDidUpdate(prevProps) {
    const {
      isFocused,
      keyboardFocusHistory,
      navigation,
      transitionProps: { isTransitioning },
    } = this.props;

    const prevTransitioning = get(prevProps, 'transitionProps.isTransitioning');

    if (isFocused && (!isTransitioning && prevTransitioning)) {
      this.searchInputRef.current.focus();
    }

    this.getDataFromParams();
  }

  getDataFromParams = () => {
    const { navigation } = this.props;
    // this.callback = ;

    this.headerTitle = navigation.getParam('headerTitle');
    // console.log('nav get params', navigation.getScreenProps());
    // console.log('nav get params', navigation);

    // console.log('getDataFromParams -- assets --', assets);

    if (!this.state.assets.length) {
      const thing = navigation.getParam('assets', []).map(appendAssetWithSearchableKey);
      // console.log('assets',assets );
      // console.log('THIGN', thing);
      // console.log('this.state.assets', this.state.assets);
      if (!!thing.length) {
        // console.log('THE THING,,,,,, its happening')
        this.setState({ assets: thing });
      }
    }
  }

  dangerouslySetIsGestureBlocked = (isGestureBlocked) => {
    // dangerouslyGetParent is a bad pattern in general, but in this case is exactly what we expect
    this.props.navigation.dangerouslyGetParent().setParams({ isGestureBlocked });
  }

  handleWillBlur = () => this.dangerouslySetIsGestureBlocked(false)

  handleWillFocus = () => this.dangerouslySetIsGestureBlocked(true)

  handlePressBack = () => this.props.navigation.navigate('MainExchangeScreen')

  handleSelectAsset = (symbol) => {
    const { navigation } = this.props;
    // It's a bit weird and I'm not sure why on invoking
    // navigation.getParam('onSelectCurrency')(symbol)
    // but this small hack seems to be a legit workaround
    const onSelectCurrency = navigation.getParam('onSelectCurrency');
    onSelectCurrency(symbol);
    navigation.navigate('MainExchangeScreen');
  }

      // {...itemProps}
  renderCurrencyItem = (item) => (
    <ExchangeCoinRow
      item={item}
      onPress={this.handleSelectAsset}
      uniqueId={item.uniqueId}
    />
  )

  handleFocusField = ({ currentTarget }) => {
    this.props.pushKeyboardFocusHistory(currentTarget);
  }

  render = () => {
    const {
      allAssets,
      navigation,
      transitionProps: { isTransitioning },
    } = this.props;

    const { assets, searchResults } = this.state;
    const items = searchResults.length ? searchResults : assets;

    return (
      <KeyboardFixedOpenLayout paddingTop={safeAreaInsetValues.top}>
        <Animated.View
          style={{
            ...position.sizeAsObject('100%'),
            opacity: Animated.interpolate(navigation.getParam('position'), {
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
            <GestureBlocker type='top'/>
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
                <TruncatedText
                  height={21}
                  letterSpacing="tighter"
                  lineHeight="loose"
                  size="large"
                  weight="bold"
                >
                  {this.headerTitle}
                </TruncatedText>
              </HeaderContainer>
              <ExchangeSearch
                autoFocus={false}
                onChangeText={this.onChangeSearchText}
                onFocus={this.handleFocusField}
                ref={this.searchInputRef}
              />
              {(items.length === 0) ? (
                <EmptyAssetList />
               ) : (
                 <ExchangeAssetList
                  items={items}
                  renderItem={this.renderCurrencyItem}
                />
               )}

            </Column>
            <GestureBlocker type='bottom'/>
          </Modal>
        </Animated.View>
      </KeyboardFixedOpenLayout>
    );
  }
}



               // <ReText text={opacity} style={{ color: 'black' }} />
                  //
                // flex={0}
                  // style={{ backgroundColor: 'blue', height: 400 }}
                  // paddingBottom={100}
                  // height={400}
export default compose(
  withNavigationFocus,
  withTransitionProps,
  withKeyboardFocusHistory,
)(CurrencySelectModal);
