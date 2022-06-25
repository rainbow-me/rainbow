import * as React from 'react';
import { Handle, InteractionManager, Keyboard, StyleSheet } from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedScrollHandler,
  Value,
} from 'react-native-reanimated';

const AnimatedScrollView = Animated.createAnimatedComponent(GHScrollView);

class ScrollPager extends React.Component {
  static defaultProps = {
    bounces: true,
    id: '',
  };

  componentDidMount() {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'layout' does not exist on type 'Readonly... Remove this comment to see the full error message
    if (this.props.layout.width) {
      this.scrollTo(
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
        this.props.navigationState.index * this.props.layout.width,
        false
      );
    }
  }

  componentDidUpdate(prevProps: any) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
    const offset = this.props.navigationState.index * this.props.layout.width;

    if (
      prevProps.navigationState.routes.length !==
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
        this.props.navigationState.routes.length ||
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'layout' does not exist on type 'Readonly... Remove this comment to see the full error message
      prevProps.layout.width !== this.props.layout.width
    ) {
      this.scrollTo(offset, false);
    } else if (
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
      prevProps.navigationState.index !== this.props.navigationState.index
    ) {
      if (this.interactionHandle === null) {
        this.interactionHandle = InteractionManager.createInteractionHandle();
      }
      this.scrollTo(offset);
    }

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'layout' does not exist on type 'Readonly... Remove this comment to see the full error message
    if (prevProps.layout.width !== this.props.layout.width) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'layout' does not exist on type 'Readonly... Remove this comment to see the full error message
      this.layoutWidthNode.setValue(this.props.layout.width);
    }
  }

  componentWillUnmount() {
    if (this.interactionHandle !== null) {
      InteractionManager.clearInteractionHandle(this.interactionHandle);
      this.interactionHandle = null;
    }
  }

  initialOffset = {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
    x: this.props.navigationState.index * this.props.layout.width,
    y: 0,
  };

  wasTouched = false;

  // InteractionHandle to handle tasks around animations
  interactionHandle: null | Handle = null;

  scrollViewRef = React.createRef<typeof AnimatedScrollView>();

  jumpTo = (key: any) => {
    this.wasTouched = false;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
    const { navigationState, keyboardDismissMode, onIndexChange } = this.props;

    const index = navigationState.routes.findIndex(
      (route: any) => route.key === key
    );

    if (navigationState.index === index) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'layout' does not exist on type 'Readonly... Remove this comment to see the full error message
      this.scrollTo(index * this.props.layout.width);
    } else {
      onIndexChange(index);
      if (keyboardDismissMode === 'auto') {
        Keyboard.dismiss();
      }
    }
  };

  scrollTo = (x: any, animated = true) => {
    if (this.scrollViewRef.current) {
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      this.scrollViewRef.current.scrollTo({
        animated: animated,
        x,
      });
    }
  };

  enterListeners = [];

  addListener = (type: any, listener: any) => {
    switch (type) {
      case 'enter':
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        this.enterListeners.push(listener);
        break;
    }
  };

  removeListener = (type: any, listener: any) => {
    switch (type) {
      case 'enter': {
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        const index = this.enterListeners.indexOf(listener);

        if (index > -1) {
          this.enterListeners.splice(index, 1);
        }

        break;
      }
    }
  };

  position = new Value(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
    this.props.navigationState.index * this.props.layout.width
  );

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'layout' does not exist on type 'Readonly... Remove this comment to see the full error message
  layoutWidthNode = new Value(this.props.layout.width);

  changeIndexIfNeeded = (newIndex: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
    if (this.props.navigationState.index !== newIndex) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'onIndexChange' does not exist on type 'R... Remove this comment to see the full error message
      this.props.onIndexChange(newIndex);
    }
  };

  handleMomentumScrollEnd = ({ nativeEvent }: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'onMomentumScrollEnd' does not exist on t... Remove this comment to see the full error message
    this.props.onMomentumScrollEnd?.(nativeEvent.contentOffset.x);
    if (this.interactionHandle !== null) {
      InteractionManager.clearInteractionHandle(this.interactionHandle);
      this.interactionHandle = null;
    }
    this.changeIndexIfNeeded(
      Math.round(
        nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width
      )
    );
  };

  render() {
    const {
      children,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'layout' does not exist on type 'Readonly... Remove this comment to see the full error message
      layout,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'onSwipeStart' does not exist on type 'Re... Remove this comment to see the full error message
      onSwipeStart,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'onSwipeEnd' does not exist on type 'Read... Remove this comment to see the full error message
      onSwipeEnd,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'overscroll' does not exist on type 'Read... Remove this comment to see the full error message
      overscroll,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'navigationState' does not exist on type ... Remove this comment to see the full error message
      navigationState,
    } = this.props;

    const handleSwipeStart = ({ nativeEvent }: any) => {
      this.wasTouched = false;
      onSwipeStart?.(nativeEvent.contentOffset.x);
      this.interactionHandle = InteractionManager.createInteractionHandle();
    };

    const handleSwipeEnd = ({ nativeEvent }: any) => {
      this.wasTouched = true;
      onSwipeEnd?.(
        nativeEvent.contentOffset.x,
        nativeEvent.targetContentOffset.x
      );
      if (this.interactionHandle !== null) {
        InteractionManager.clearInteractionHandle(this.interactionHandle);
        this.interactionHandle = null;
      }
      const maybeIndex =
        nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width;
      if (maybeIndex === Math.round(maybeIndex)) {
        // we are finished with moving
        this.changeIndexIfNeeded(Math.round(maybeIndex));
      }
    };

    // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
    return children({
      addListener: this.addListener,
      jumpTo: this.jumpTo,
      removeListener: this.removeListener,
      render: (children: any) => (
        <AnimatedScrollView
          automaticallyAdjustContentInsets={false}
          bounces={overscroll}
          contentContainerStyle={
            layout.width
              ? {
                  flex: 1,
                  flexDirection: 'row',
                  width: layout.width * navigationState.routes.length,
                }
              : null
          }
          contentOffset={this.initialOffset}
          directionalLockEnabled
          keyboardShouldPersistTaps="always"
          onMomentumScrollEnd={this.handleMomentumScrollEnd}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'scrollHandler' does not exist on type 'R... Remove this comment to see the full error message
          onScroll={this.props.scrollHandler}
          onScrollBeginDrag={handleSwipeStart}
          onScrollEndDrag={handleSwipeEnd}
          overScrollMode="never"
          pagingEnabled
          ref={this.scrollViewRef}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'swipeEnabled' does not exist on type 'Re... Remove this comment to see the full error message
          scrollEnabled={this.props.swipeEnabled}
          scrollEventThrottle={1}
          scrollToOverflowEnabled
          scrollsToTop={false}
          showsHorizontalScrollIndicator={false}
          style={styles.container}
        >
          {children}
        </AnimatedScrollView>
      ),
    });
  }
}

export default function ScrollPagerWrapperWithScrollHandler(props: any) {
  const scrollHandler = useAnimatedScrollHandler(event => {
    props.position.value =
      event.contentOffset.x / event.layoutMeasurement.width;
  });
  return <ScrollPager {...props} scrollHandler={scrollHandler} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
