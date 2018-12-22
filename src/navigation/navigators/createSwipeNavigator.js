import { get, map } from 'lodash';
import PropTypes from 'prop-types';
import React, { createElement, PureComponent } from 'react';
import { createNavigator, StackRouter } from 'react-navigation';
import { FlatList, StatusBar, View } from 'react-native';
import { deviceUtils } from '../../utils';

const EMPTY_ARRAY = [];

export default function createSwipeNavigator(screens, options) {
  const router = StackRouter(screens, options);
  const routeOrder = options.order || map(screens, ({ name }) => name);
  const initialScreens = map(screens, () => screens[options.initialRouteName]);
  const loadedScreens = map(screens, (screen) => screen);
  const onSwipeStart = options.onSwipeStart || function noop() {};
  const onSwipeEnd = options.onSwipeEnd || function noop() {};

  let isSwiping = false;

  class NavigationView extends PureComponent {
    static propTypes = {
      descriptors: PropTypes.object,
      navigation: PropTypes.object,
      navigationConfig: PropTypes.object,
      screenProps: PropTypes.object,
    };

    state = {
      currentIndex: 0,
      flatListScreens: initialScreens,
      scrollEnabled: true,
    };

    constructor(props) {
      super(props);

      router.getComponentForRouteName = this.getComponentForRouteName;
    }

    /**
     * Get the component for a given route and scroll there.
     * @param  {String} routeName   The name of the route to get the component of.
     * @return {Object}             The component for the given route.
     */
    getComponentForRouteName = (routeName) => {
      const routeIndex = this.getRouteIndex(routeName);

      this.scrollToIndex(routeIndex);

      return loadedScreens[routeIndex];
    };

    /**
     * Get the current route in the StackRouter.
     * @return {Object} The current route from the StackRouter.
     */
    getCurrentRoute = () => {
      const { navigation } = this.props;

      const routes = get(navigation, 'state.routes', []);

      return routes[routes.length - 1] || {};
    };

    /**
     * Get the previous route in the StackRouter.
     * @return {Object} The previous route from the StackRouter.
     */
    getPreviousRoute = () => {
      const { navigation } = this.props;

      const routes = get(navigation, 'state.routes', []);

      return routes[routes.length - 2] || {};
    };

    /**
     * Get the index of a route.
     * @param  {String} routeName   The name of the route to get the index of.
     * @return {Number}             The index of the route which will be zero if the route does not exist.
     */
    getRouteIndex = (routeName) => {
      return (routeOrder || EMPTY_ARRAY).indexOf(routeName);
    };

    /**
     * Get item data based on screen dimensions.
     * @param  {Object} data    The items being rendered by the FlatList.
     * @param  {Number} index   The index of the current item in the FlatList.
     * @return {Object}         Layout data based on the index and screen dimensions.
     */
    getItemLayout = (data, index) => {
      const length = deviceUtils.dimensions.height || 0;
      const offset = deviceUtils.dimensions.width * index || 0;

      return { index, length, offset };
    };

    /**
     * Go back to the previous route with a scroll animation.
     * If the route is not part of the swipe navigator
     * use the standard navigation.goBack behavior.
     */
    goBack = () => {
      const { navigation } = this.props;

      const previousRoute = this.getPreviousRoute();
      const routeIndex = this.getRouteIndex(previousRoute.routeName);

      if (routeIndex === -1) {
        navigation.goBack();
      } else {
        this.scrollToIndex(routeIndex, true);
      }
    };

    handleFlatListRef = (flatListRef) => { this.flatListRef = flatListRef; }

    /**
     * Navigate to a screen with certain params and a scroll animation.
     * If the route is not part of the swipe navigator
     * use the standard navigation.goBack behavior.
     * @param  {String} routeName   The screen to navigate to.
     * @param  {Object} params      Parameters to be passed to the screen.
     */
    navigate = (routeName, params) => {
      const { navigation } = this.props;

      const routeIndex = this.getRouteIndex(routeName);

      if (routeIndex === -1) {
        navigation.navigate(routeName, params);
      } else {
        navigation.setParams(params);

        this.scrollToIndex(routeIndex, true);
      }
    };

    /**
     * Scroll to the initial route provided in createSwipeNavigator options
     * when the view is rendered and sizing is calculated.
     * Replace initial screens with the final screens.
     */
    onLayout = () => {
      const routeIndex = this.getRouteIndex(options.initialRouteName);

      this.scrollToIndex(routeIndex, false);

      this.setState({ flatListScreens: loadedScreens });
    }

    /**
     * Handle adding the next screen to the router stack when scrolling has ended.
     * @param  {Object} options.nativeEvent   The native event with layout data.
     */
    onScrollEndDrag = ({ nativeEvent }) => {
      const { navigation } = this.props;

      const currentOffsetX = get(nativeEvent, 'contentOffset.x', 0);
      const currentScreenIndex = Math.floor(currentOffsetX / deviceUtils.dimensions.width);
      const currentScreenName = routeOrder[currentScreenIndex] || options.initialRouteName;

      navigation.navigate(currentScreenName);
    };

    /**
     * Handle updating the current index of the FlatList when
     * the scroll point is past the halfway point to the next page.
     * @param  {Object} options.nativeEvent   The native event with layout data.
     */
    onScroll = ({ nativeEvent }) => {
      const layoutMeasurementWidth = get(nativeEvent, 'layoutMeasurement.width', 0);
      const currentOffsetX = get(nativeEvent, 'contentOffset.x', 0);

      this.setState(({ currentIndex }) => {
        const startOffsetX = currentIndex * deviceUtils.dimensions.width;
        const endOffsetXLeft = (currentIndex - 1) * deviceUtils.dimensions.width;
        const endOffsetXRight = (currentIndex + 1) * deviceUtils.dimensions.width;

        const beginningOffset = currentOffsetX - startOffsetX;

        let newIndex = currentIndex;
        if (beginningOffset > (endOffsetXRight - startOffsetX) / 2) {
          newIndex = currentIndex + 1;
        } else if (beginningOffset < (endOffsetXLeft - startOffsetX) / 2) {
          newIndex = currentIndex - 1;
        }

        if (!isSwiping && currentOffsetX % layoutMeasurementWidth !== 0) {
          isSwiping = true;
          onSwipeStart();
        }

        return { currentIndex: newIndex };
      });
    };

    onMomentumScrollEnd = () => {
      const { navigation } = this.props;

      if (isSwiping) {
        isSwiping = false;
        onSwipeEnd(navigation);
      }
    };

    /**
     * Scroll to a given index in the flat list.
     * @param  {Number}  index      The index in the flat list to scroll to.
     * @param  {Boolean} animated   Whether or not to animate to the index.
     */
    scrollToIndex = (index, animated) => {
      if (this.flatListRef && typeof this.flatListRef.scrollToIndex === 'function') {
        this.flatListRef.scrollToIndex({ animated, index, viewOffset: 0 });
      }
    };

    toggleSwiping = scrollEnabled => {
      this.setState({ scrollEnabled });
    };

    /**
     * Render an item in the FlatList component.
     * @param  {Number} options.index   The index of the current item.
     * @param  {Object} options.item    The current item.
     * @return {Element}                The screen element to be rendered.
     */
    renderItem = ({ index, item }) => {
      const { navigation } = this.props;

      return (
        <View key={item.name} style={deviceUtils.dimensions}>
          {createElement(item.screen, {
            isScreenActive: index === this.state.currentIndex,
            navigation: {
              ...navigation,
              goBack: this.goBack,
              navigate: this.navigate,
            },
            toggleSwiping: this.toggleSwiping,
          })}
        </View>
      );
    };

    render() {
      const { currentIndex, flatListScreens, scrollEnabled } = this.state;

      const currentScreenName = routeOrder[currentIndex] || '';
      const currentScreen = screens[currentScreenName] || {};

      return (
        <View onLayout={this.onLayout}>
          <StatusBar
            animated
            barStyle={currentScreen.statusBarColor}
          />
          <FlatList
            bounces={false}
            data={flatListScreens}
            extraData={{ currentIndex }}
            getItemLayout={this.getItemLayout}
            horizontal
            onScrollEndDrag={this.onScrollEndDrag}
            onMomentumScrollEnd={this.onMomentumScrollEnd}
            onScroll={this.onScroll}
            pagingEnabled
            ref={this.handleFlatListRef}
            removeClippedSubviews
            renderItem={this.renderItem}
            scrollEnabled={scrollEnabled}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      );
    }
  }

  return createNavigator(NavigationView, router, options);
}
