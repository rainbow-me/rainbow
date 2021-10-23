import ViewPager from '@react-native-community/viewpager';
import React, { forwardRef, useEffect } from 'react';
import { Keyboard } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAnimatedPageScrollHandler } from '../hooks/useAnimatedPageScrollHandler';
import { usePagerPosition } from './ScrollPositionContext';
const AnimatedViewPager = Animated.createAnimatedComponent(ViewPager);

// eslint-disable-next-line react/display-name
const ViewPagerWrapper = forwardRef((props, fref) => {
  const ref = React.useRef();

  useEffect(
    () =>
      android && ref?.current?.getNode().setPageWithoutAnimation(props.page),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  React.useImperativeHandle(fref, () => ref.current);
  return <AnimatedViewPager ref={ref} {...props} />;
});

class ViewPagerBackend extends React.Component {
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

  justScrolled = false;

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
      removeListener: this.removeListener,
      render: children => (
        <ViewPagerWrapper
          keyboardDismissMode={
            // ViewPager does not accept auto mode
            keyboardDismissMode === 'auto' ? 'on-drag' : keyboardDismissMode
          }
          lazy={false}
          onPageScroll={this.props.scrollHandler}
          onPageScrollStateChanged={this.onPageScrollStateChanged}
          onPageSelected={e => this.onIndexChange(e.nativeEvent.position)}
          orientation={orientation}
          overScrollMode={overScrollMode}
          overdrag={overdrag}
          page={this.props.navigationState.index}
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

export default function ViewPagerBackendWithScrollHandler(props) {
  const scrollPosition = usePagerPosition();
  const scrollHandler = useAnimatedPageScrollHandler(e => {
    'worklet';
    scrollPosition && (scrollPosition.value = e.offset + e.position);
  });

  return <ViewPagerBackend {...props} scrollHandler={scrollHandler} />;
}
