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
import { ExchangeCoinRow, SendCoinRow } from '../components/coin-row';
import GestureBlocker from '../components/GestureBlocker';
import { Monospace, TruncatedText } from '../components/text';
import { withAccountData } from '../hoc';
import { borders, colors, position } from '../styles';
import { BackButton } from '../components/header';
import { ExchangeSearch } from '../components/exchange';
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

class SelectCurrencyModal extends PureComponent {
  static propTypes = {
    allAssets: PropTypes.array,
    navigation: PropTypes.object,
  }

  callback = null

  keyboardHeight = 0

  viewportHeight = deviceUtils.dimensions.height

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

    // console.log('getDataFromParams this.keyboardHeight', this.keyboardHeight);

    this.viewportHeight = deviceUtils.dimensions.height - this.keyboardHeight;
    // console.log('getDataFromParams this.viewportHeight', this.viewportHeight);
  }

  dangerouslySetIsGestureBlocked = (isGestureBlocked) => {
    // dangerouslyGetParent is a bad pattern in general, but in this case is exactly what we expect
    this.props.navigation.dangerouslyGetParent().setParams({ isGestureBlocked });
  }

  handleWillBlur = () => this.dangerouslySetIsGestureBlocked(false)

  handleWillFocus = () => this.dangerouslySetIsGestureBlocked(true)

  handlePressBack = () => this.props.navigation.navigate('MainExchangeScreen')

  handleSelectAsset = (symbol) => {
    // It's a bit weird and I'm not sure why on invoking
    // navigation.getParam('onSelectCurrency')(symbol)
    // but this small hack seems to be a legit workaround
    this.callback(symbol);
    this.props.navigation.navigate('MainExchangeScreen');
  }

  renderCurrencyItem = (itemProps) => (
    <ExchangeCoinRow
      {...itemProps}
      onPress={this.handleSelectAsset}
    />
  )

  handleDidFocus = () => {
    // setTimeout(() => this.searchInputRef.current.focus(), 500);
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

    const fakeDataThatNeedsToBeHookedUp = [
      {
        balances: true,
        data: this.props.allAssets,
        renderItem: this.renderCurrencyItem,
      },
    ];

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
                  ref={this.searchInputRef}
                />
                <AssetList
                  hideHeader
                  flex={1}
                  style={{ flex: 1 }}
                  sections={fakeDataThatNeedsToBeHookedUp}
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
  withAccountData,
  withNavigationFocus,
)(SelectCurrencyModal);
