import ViewPager from '@react-native-community/viewpager';
import React, { forwardRef, useEffect } from 'react';
import { Keyboard } from 'react-native';
import Animated from 'react-native-reanimated';
const AnimatedViewPager = Animated.createAnimatedComponent(ViewPager);

const { event, add } = Animated;

// eslint-disable-next-line react/display-name
const ViewPagerWrapper = forwardRef((props, fref) => {
  const ref = React.useRef();
  useEffect(() => {
    android &&
      ref?.current?.getNode().setPageWithoutAnimation(props.initialPage);
  }, [props.initialPage]);
  React.useImperativeHandle(fref, () => ref.current);
  return <AnimatedViewPager ref={ref} {...props} />;
});

export default class ViewPagerBackend extends React.Component {
  static defaultProps = {
    onIndexChange: () => {},
    swipeEnabled: true,
  };

  componentDidUpdate(prevProps) {
    if (
      prevProps.navigationState.index !== this.props.navigationState.index &&
      !this.justScrolled
    ) {
      this.jumpToIndex(this.props.navigationState.index);
    }
    this.justScrolled = false;
  }

  enterListeners = [];

  jumpToIndex = index => {
    // If the index changed, we need to trigger a tab switch
    // this.isSwipeGesture.setValue(FALSE);
    this.ref.current.getNode().setPage(index);
  };

  jumpTo = key => {
    const { navigationState, keyboardDismissMode, onIndexChange } = this.props;
    const index = navigationState.routes.findIndex(route => route.key === key);

    // A tab switch might occur when we're in the middle of a transition
    // In that case, the index might be same as before
    // So we conditionally make the pager to update the position
    if (navigationState.index !== index) {
      onIndexChange(index);
      this.jumpToIndex(index);

      // When the index changes, the focused input will no longer be in current tab
      // So we should dismiss the keyboard
      if (keyboardDismissMode === 'auto') {
        Keyboard.dismiss();
      }
    }
  };

  addListener = (type, listener) => {
    // eslint-disable-next-line default-case
    switch (type) {
      case 'enter':
        this.enterListeners.push(listener);
        break;
    }
  };

  removeListener = (type, listener) => {
    // eslint-disable-next-line default-case
    switch (type) {
      case 'enter': {
        const index = this.enterListeners.indexOf(listener);

        if (index > -1) {
          this.enterListeners.splice(index, 1);
        }

        break;
      }
    }
  };

  currentIndex = new Animated.Value(this.props.navigationState.index);
  offset = new Animated.Value(0);
  justScrolled = false;

  onPageScroll = event([
    {
      nativeEvent: {
        offset: this.offset,
        position: this.currentIndex,
      },
    },
  ]);

  onPageScrollStateChanged = state => {
    // eslint-disable-next-line default-case
    switch (state) {
      case 'Settling':
        this.props.onSwipeEnd && this.props.onSwipeEnd();
        return;
      case 'Dragging':
        this.props.onSwipeStart && this.props.onSwipeStart();
        return;
    }
  };

  onIndexChange(newPosition) {
    if (newPosition !== this.props.navigationState.index) {
      // assuming gesture
      this.justScrolled = true;
    }
    this.props.onIndexChange(newPosition);
  }

  ref = React.createRef();

  render() {
    const {
      style,
      keyboardDismissMode,
      swipeEnabled,
      children,
      orientation,
      transition,
      showPageIndicator,
      pageMargin,
      overdrag,
      overScrollMode,
    } = this.props;

    return children({
      addListener: this.addListener,
      jumpTo: this.jumpTo,
      position: add(this.currentIndex, this.offset),
      removeListener: this.removeListener,
      render: children => (
        <ViewPagerWrapper
          initialPage={this.props.navigationState.index}
          keyboardDismissMode={
            // ViewPager does not accept auto mode
            keyboardDismissMode === 'auto' ? 'on-drag' : keyboardDismissMode
          }
          lazy={false}
          onPageScroll={this.onPageScroll}
          onPageScrollStateChanged={this.onPageScrollStateChanged}
          onPageSelected={e => this.onIndexChange(e.nativeEvent.position)}
          orientation={orientation}
          overScrollMode={overScrollMode}
          overdrag={overdrag}
          pageMargin={pageMargin}
          ref={this.ref}
          scrollEnabled={swipeEnabled}
          showPageIndicator={showPageIndicator}
          style={[{ flex: 1 }, style]}
          transitionStyle={transition}
        >
          {children}
        </ViewPagerWrapper>
      ),
    });
  }
}
