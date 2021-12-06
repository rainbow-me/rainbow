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
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      android && ref?.current?.getNode().setPageWithoutAnimation(props.page),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  React.useImperativeHandle(fref, () => ref.current);
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <AnimatedViewPager ref={ref} {...props} />;
});

class ViewPagerBackend extends React.Component {
  static defaultProps = {
    onIndexChange: () => {},
    swipeEnabled: true,
  };

  componentDidUpdate(prevProps: any) {
    if (
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
      prevProps.navigationState.index !== this.props.navigationState.index &&
      !this.justScrolled
    ) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
      this.jumpToIndex(this.props.navigationState.index);
    }
    this.justScrolled = false;
  }

  enterListeners = [];

  jumpToIndex = (index: any) => {
    // If the index changed, we need to trigger a tab switch
    // this.isSwipeGesture.setValue(FALSE);
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    this.ref.current.getNode().setPage(index);
  };

  jumpTo = (key: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
    const { navigationState, keyboardDismissMode, onIndexChange } = this.props;
    const index = navigationState.routes.findIndex(
      (route: any) => route.key === key
    );

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

  addListener = (type: any, listener: any) => {
    // eslint-disable-next-line default-case
    switch (type) {
      case 'enter':
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
        this.enterListeners.push(listener);
        break;
    }
  };

  removeListener = (type: any, listener: any) => {
    // eslint-disable-next-line default-case
    switch (type) {
      case 'enter': {
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
        const index = this.enterListeners.indexOf(listener);

        if (index > -1) {
          this.enterListeners.splice(index, 1);
        }

        break;
      }
    }
  };

  justScrolled = false;

  onPageScrollStateChanged = (state: any) => {
    // eslint-disable-next-line default-case
    switch (state) {
      case 'Settling':
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'onSwipeEnd' does not exist on type 'Read... Remove this comment to see the full error message
        this.props.onSwipeEnd && this.props.onSwipeEnd();
        return;
      case 'Dragging':
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'onSwipeStart' does not exist on type 'Re... Remove this comment to see the full error message
        this.props.onSwipeStart && this.props.onSwipeStart();
        return;
    }
  };

  onIndexChange(newPosition: any) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
    if (newPosition !== this.props.navigationState.index) {
      // assuming gesture
      this.justScrolled = true;
    }
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'onIndexChange' does not exist on type 'R... Remove this comment to see the full error message
    this.props.onIndexChange(newPosition);
  }

  ref = React.createRef();

  render() {
    const {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'style' does not exist on type 'Readonly<... Remove this comment to see the full error message
      style,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'keyboardDismissMode' does not exist on t... Remove this comment to see the full error message
      keyboardDismissMode,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'swipeEnabled' does not exist on type 'Re... Remove this comment to see the full error message
      swipeEnabled,
      children,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'orientation' does not exist on type 'Rea... Remove this comment to see the full error message
      orientation,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'transition' does not exist on type 'Read... Remove this comment to see the full error message
      transition,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'showPageIndicator' does not exist on typ... Remove this comment to see the full error message
      showPageIndicator,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'pageMargin' does not exist on type 'Read... Remove this comment to see the full error message
      pageMargin,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'overdrag' does not exist on type 'Readon... Remove this comment to see the full error message
      overdrag,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'overScrollMode' does not exist on type '... Remove this comment to see the full error message
      overScrollMode,
    } = this.props;

    // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
    return children({
      addListener: this.addListener,
      jumpTo: this.jumpTo,
      removeListener: this.removeListener,
      render: (children: any) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ViewPagerWrapper
          keyboardDismissMode={
            // ViewPager does not accept auto mode
            keyboardDismissMode === 'auto' ? 'on-drag' : keyboardDismissMode
          }
          lazy={false}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'scrollHandler' does not exist on type 'R... Remove this comment to see the full error message
          onPageScroll={this.props.scrollHandler}
          onPageScrollStateChanged={this.onPageScrollStateChanged}
          onPageSelected={(e: any) =>
            this.onIndexChange(e.nativeEvent.position)
          }
          orientation={orientation}
          overScrollMode={overScrollMode}
          overdrag={overdrag}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
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

export default function ViewPagerBackendWithScrollHandler(props: any) {
  const scrollPosition = usePagerPosition();
  const scrollHandler = useAnimatedPageScrollHandler(e => {
    'worklet';
    // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
    scrollPosition && (scrollPosition.value = e.offset + e.position);
  });

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <ViewPagerBackend {...props} scrollHandler={scrollHandler} />;
}
