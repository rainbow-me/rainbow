import { get, isNull, omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component, createElement } from 'react';
import { FlatList, StatusBar, View } from 'react-native';
import { withHideSplashScreenOnMount } from '../hoc';
import { deviceUtils } from '../utils';
import QRScannerScreenWithData from './QRScannerScreenWithData';
import SettingsScreenWithData from './SettingsScreenWithData';
import WalletScreen from './WalletScreen';

const SwipeLayoutScreens = [{
  name: 'SettingsScreen',
  screen: SettingsScreenWithData,
  statusBarColor: 'dark-content',
}, {
  name: 'WalletScreen',
  screen: WalletScreen,
  statusBarColor: 'dark-content',
}, {
  name: 'QRScannerScreen',
  screen: QRScannerScreenWithData,
  statusBarColor: 'light-content',
}];

const getSwipeItemLayout = (data, index) => ({
  index,
  length: deviceUtils.dimensions.height,
  offset: deviceUtils.dimensions.width * index,
});

class SwipeLayout extends Component {
  static propTypes = {
    initialScrollIndex: PropTypes.number,
  }

  static defaultProps = {
    initialScrollIndex: 1,
  }

  state = {
    currentScreenIndex: null,
    prevScreenIndex: null,
  }

  handleListRef = (ref) => { this.listRef = ref; }

  handleSwipeBegin = () => this.setState({ isSwiping: true })
  handleSwipeEnd = () => this.setState({ isSwiping: false })

  handleNavigateBack = () => this.scrollToIndex(this.state.prevScreenIndex)
  handleNavigateInitial = () => this.scrollToIndex(this.props.initialScrollIndex, false)
  handleNavigate = (navigateToScreenName) => {
    const indexForName = SwipeLayoutScreens.findIndex(({ name }) => (
      name === navigateToScreenName
    ));

    this.scrollToIndex(indexForName);
  }

  handlePageChange = ({ nativeEvent: { contentOffset } }) => {
    this.handleSwipeEnd();

    if (contentOffset) {
      const currentScreenIndex = Math.round(contentOffset.x / deviceUtils.dimensions.width);
      const prevScreenIndex = this.state.currentScreenIndex;

      if (currentScreenIndex !== prevScreenIndex) {
        this.setState({
          currentScreenIndex,
          prevScreenIndex: prevScreenIndex || this.props.initialScrollIndex,
        });
      }
    }
  }

  scrollToIndex = (scrollToIndex, animated = true) => {
    if (this.listRef) {
      this.listRef.scrollToIndex({
        animated,
        index: scrollToIndex,
        viewOffset: 0,
      });
    }
  }

  renderItem = ({ index, item }) => {
    const {
      isActive,
      isSwiping,
      name,
      screen,
    } = item;

    return (
      <View key={name} style={{ ...deviceUtils.dimensions }}>
        {createElement(screen, {
          ...omit(this.props, Object.keys(SwipeLayout.propTypes)),
          isScreenActive: isActive,
          isSwiping,
          navigation: {
            goBack: this.handleNavigateBack,
            navigate: this.handleNavigate,
          },
        })}
      </View>
    );
  }

  renderStatusBar = () => {
    const { initialScrollIndex } = this.props;
    const { currentScreenIndex, isSwiping } = this.state;

    const currentIndex = Number.isInteger(currentScreenIndex) ? currentScreenIndex : initialScrollIndex;
    const statusBarForScreen = isSwiping ? initialScrollIndex : currentIndex;

    return (
      <StatusBar
        animated
        barStyle={SwipeLayoutScreens[statusBarForScreen].statusBarColor}
        networkActivityIndicatorVisible={true}
      />
    );
  }

  render = () => {
    const { initialScrollIndex } = this.props;
    const { currentScreenIndex, isSwiping } = this.state;

    return (
      <View onLayout={this.handleNavigateInitial}>
        {this.renderStatusBar()}
        <FlatList
          bounces={false}
          data={SwipeLayoutScreens.map((screen, index) => ({
            ...screen,
            isActive: index === (isNull(currentScreenIndex) ? initialScrollIndex : currentScreenIndex),
            isSwiping,
          }))}
          getItemLayout={getSwipeItemLayout}
          horizontal
          initialScrollIndex={initialScrollIndex}
          onMomentumScrollEnd={this.handlePageChange}
          onScrollBeginDrag={this.handleSwipeBegin}
          pagingEnabled
          ref={this.handleListRef}
          removeClippedSubviews
          renderItem={this.renderItem}
          scrollEventThrottle={0}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  }
}

export default withHideSplashScreenOnMount(SwipeLayout);
