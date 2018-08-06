import PropTypes from 'prop-types';
import React, { Component, createElement } from 'react';
import { createNavigator, StackRouter } from 'react-navigation';
import { FlatList, StatusBar, View } from 'react-native';
import { get, map } from 'lodash';

import { deviceUtils } from '../utils';

export default function createSwipeNavigator(screens, options) {
  const router = StackRouter(screens, options);
  const routeOrder = options.order || map(screens, ({ name }) => name);
  const flatListScreens = map(screens, (screen) => screen);

  class NavigationView extends Component {
    static propTypes = {
      descriptors: PropTypes.object,
      navigation: PropTypes.object,
      navigationConfig: PropTypes.object,
      screenProps: PropTypes.object,
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
      const routeIndex = (routeOrder || []).indexOf(routeName);

      return routeIndex > -1 ? routeIndex : 0;
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
     */
    goBack = () => {
      const previousRoute = this.getPreviousRoute();
      const routeIndex = this.getRouteIndex(previousRoute.routeName);

      this.scrollToIndex(routeIndex, true);
    };

    /**
     * Navigate to a screen with certain params and a scroll animation.
     * @param  {String} routeName   The screen to navigate to.
     * @param  {Object} params      Parameters to be passed to the screen.
     */
    navigate = (routeName, params) => {
      const { navigation } = this.props;

      const routeIndex = this.getRouteIndex(routeName);

      navigation.setParams(params);

      this.scrollToIndex(routeIndex, true);
    };

    /**
     * Scroll to the initial route provided in createSwipeNavigator options
     * when the view is rendered and sizing is calculated.
     */
    onLayout = () => {
      const routeIndex = this.getRouteIndex(options.initialRouteName);

      this.scrollToIndex(routeIndex, false);
    };

    /**
     * Handle adding the next screen to the router stack when scrolling has ended.
     * @param  {Object} options.nativeEvent   The native event with layout data.
     */
    onMomentumScrollEnd = ({ nativeEvent }) => {
      const { navigation } = this.props;

      const currentOffsetX = get(nativeEvent, 'contentOffset.x', 0);
      const currentScreenIndex = Math.floor(currentOffsetX / deviceUtils.dimensions.width);
      const currentScreenName = routeOrder[currentScreenIndex] || options.initialRouteName;

      navigation.navigate(currentScreenName);
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
          {createElement(item.screen, { navigation: { ...navigation, goBack: this.goBack, navigate: this.navigate } })}
        </View>
      );
    };

    render() {
      const currentRoute = this.getCurrentRoute();

      return (
        <View onLayout={this.onLayout}>
          <StatusBar
            animated
            barStyle={screens[currentRoute.routeName].statusBarColor}
            networkActivityIndicatorVisible={true}
          />
          <FlatList
            bounces={false}
            data={flatListScreens}
            getItemLayout={this.getItemLayout}
            horizontal
            onMomentumScrollEnd={this.onMomentumScrollEnd}
            pagingEnabled
            ref={(flatListRef) => { this.flatListRef = flatListRef; }}
            removeClippedSubviews
            renderItem={this.renderItem}
            scrollEventThrottle={0}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      );
    }
  }

  return createNavigator(NavigationView, router, options);
}
