import { isEmpty, map } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { compose, withHandlers } from 'recompact';
import { KeyboardAvoidingView, View } from 'react-native'
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import styled from 'styled-components/primitives';
import { Centered, Column, FlexItem, Row } from '../components/layout';
import { deviceUtils, safeAreaInsetValues } from '../utils';
import { Modal, ModalHeader } from '../components/modal';
import AssetList from '../components/asset-list/RecyclerAssetList';
import { SendCoinRow } from '../components/coin-row';
import GestureBlocker from '../components/GestureBlocker';
import { Monospace, TruncatedText } from '../components/text';
import { borders, colors, position } from '../styles';
import StarIcon from '../components/icons/svg/StarIcon';
import { BackButton } from '../components/header';
import { ExchangeSearch } from '../components/exchange';
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

const BottomRow = ({ balance, symbol }) => (
  <Monospace
    color={colors.alpha(colors.blueGreyDark, 0.6)}
    size="smedium"
  >
    {symbol}
  </Monospace>
);

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
  symbol: PropTypes.string,
};

const CurrencyRenderItem = ({ favorite, item, onPress }) => (
  <SendCoinRow
    {...item}
    bottomRowRender={BottomRow}
    onPress={onPress}
  >
    <FlexItem flex={0} style={{ marginLeft: 8 }}>
      <StarIcon color={favorite ? colors.orangeLight : colors.grey} />
    </FlexItem>
  </SendCoinRow>
);

CurrencyRenderItem.propTypes = {
  favorite: PropTypes.bool,
  index: PropTypes.number,
  item: PropTypes.shape({
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }),
  onPress: PropTypes.func,
};

const EnhancedCurrencyRenderItem = withHandlers({
  onPress: ({ item, onPress }) => () => onPress(item),
})(CurrencyRenderItem);

class SelectCurrencyModal extends PureComponent {
  static propTypes = {
    navigation: PropTypes.object,
  }

  state = {
    searchResults: [],
  }

  assets = []

  callback = null

  keyboardHeight = 0

  viewportHeight = deviceUtils.dimensions.height

  onChangeSearchText = (searchPhrase) => {
    const searchResults = filterList(this.assets, searchPhrase, 'index');
    this.setState({ searchResults });
  }

  searchInputRef = React.createRef()

  componentDidMount() {
    this.getDataFromParams();
  }

  componentDidUpdate() {
    this.getDataFromParams();
  }

  getDataFromParams = () => {
    const { navigation } = this.props;
    this.callback = navigation.getParam('onSelectCurrency');
    this.keyboardHeight = navigation.getParam('keyboardHeight');
    const assets = navigation.getParam('assets') || [];
    const indexedAssets = map(assets, asset => ({ ...asset, index: `${asset.name} ${asset.symbol}` }));
    this.assets = indexedAssets;
    this.viewportHeight = deviceUtils.dimensions.height - this.keyboardHeight;
  }

  dangerouslySetIsGestureBlocked = (isGestureBlocked) => {
    // dangerouslyGetParent is a bad pattern in general, but in this case is exactly what we expect
    this.props.navigation.dangerouslyGetParent().setParams({ isGestureBlocked });
  }

  handleWillBlur = () => this.dangerouslySetIsGestureBlocked(false)

  handleWillFocus = () => this.dangerouslySetIsGestureBlocked(true)

  handlePressBack = () => this.props.navigation.navigate('MainExchangeScreen')

  handleSelectAsset = (item) => {
    // It's a bit weird and I'm not sure why on invoking
    // navigation.getParam('onSelectCurrency')(item)
    // but this small hack seems to be a legit workaround
    this.callback(item);
    this.props.navigation.navigate('MainExchangeScreen');
  }

  renderCurrencyItem = (itemProps) => (
    <EnhancedCurrencyRenderItem
      {...itemProps}
      onPress={this.handleSelectAsset}
    />
  )

  handleDidFocus = () => {
    // setTimeout(() => this.searchInputRef.current.focus(), 500);
  }

  getSections = () => {
    const data = isEmpty(this.state.searchResults) ? this.assets : this.state.searchResults;
    return [{
      balances: true,
      data,
      renderItem: this.renderCurrencyItem,
    }];
  }


  render() {
    const magicNumber = this.viewportHeight
      ? (this.viewportHeight - 10) // - 5
      : 0;

    if (!!this.viewportHeight) {
      // console.log(' ')
      // console.log('SelectCurrencyModal -- isFocused', this.props.isFocused);
      // console.log('magicNumber', magicNumber);
      // console.log('SelectCurrencyModal -- this.props', this.props);
      // console.log('this.viewportHeight', this.viewportHeight);
      // console.log(' ')
    }

    return (
      <View
        style={{
          ...deviceUtils.dimensions,
          ...position.coverAsObject,
          // height: deviceUtils.dimensions.height,
          // width: deviceUtils.dimensions.width,
          // flexDirection: 'column',
          // alignItems: 'flex-end',//'stretch',
          // justifyContent: 'flex-end',
        }}
      >
        <KeyboardAvoidingView
          behavior="height"
          contentContainerStyle={{
            // ...position.sizeAsObject('100%'),
            // alignItems: 'center',
          // alignItems="center"
          // justifyContent="center"
            // justifyContent: 'center',
          }}
        >

          <Row style={{
            ...position.sizeAsObject('100%'),
            // position: 'absolute',
            // top: safeAreaInsetValues.top,
            // justifyContent: 'flex-end',
            paddingBottom: 10,
            paddingTop: safeAreaInsetValues.top,
          }}>
            <Modal
              containerPadding={0}
              height="100%"
              overflow="hidden"
              radius={exchangeModalBorderRadius}
            >
              <GestureBlocker type='top'/>
              <NavigationEvents
                onDidFocus={this.handleDidFocus}
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
                    Receive
                  </TruncatedText>
                </HeaderContainer>
                <ExchangeSearch
                  autoFocus={false}
                  onChangeText={this.onChangeSearchText}
                  ref={this.searchInputRef}
                />
                <AssetList
                  hideHeader
                  flex={1}
                  style={{ flex: 1 }}
                  sections={this.getSections()}
                />
              </Column>
              <GestureBlocker type='bottom'/>
            </Modal>
          </Row>
        </KeyboardAvoidingView>
      </View>
    );
  }
}

export default compose(
  withNavigationFocus,
)(SelectCurrencyModal);
