import * as React from 'react';
import { InteractionManager, Keyboard, StyleSheet } from 'react-native';
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
    if (this.props.layout.width) {
      this.scrollTo(
        this.props.navigationState.index * this.props.layout.width,
        false
      );
    }
  }

  componentDidUpdate(prevProps) {
    const offset = this.props.navigationState.index * this.props.layout.width;

    if (
      prevProps.navigationState.routes.length !==
        this.props.navigationState.routes.length ||
      prevProps.layout.width !== this.props.layout.width
    ) {
      this.scrollTo(offset, false);
    } else if (
      prevProps.navigationState.index !== this.props.navigationState.index
    ) {
      if (this.interactionHandle === null) {
        this.interactionHandle = InteractionManager.createInteractionHandle();
      }
      this.scrollTo(offset);
    }

    if (prevProps.layout.width !== this.props.layout.width) {
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
    x: this.props.navigationState.index * this.props.layout.width,
    y: 0,
  };

  wasTouched = false;

  // InteractionHandle to handle tasks around animations
  interactionHandle = null;

  scrollViewRef = React.createRef();

  jumpTo = key => {
    this.wasTouched = false;
    const { navigationState, keyboardDismissMode, onIndexChange } = this.props;

    const index = navigationState.routes.findIndex(route => route.key === key);

    if (navigationState.index === index) {
      this.scrollTo(index * this.props.layout.width);
    } else {
      onIndexChange(index);
      if (keyboardDismissMode === 'auto') {
        Keyboard.dismiss();
      }
    }
  };

  scrollTo = (x, animated = true) => {
    if (this.scrollViewRef.current) {
      this.scrollViewRef.current.getNode().scrollTo({
        animated: animated,
        x,
      });
    }
  };

  enterListeners = [];

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

  position = new Value(
    this.props.navigationState.index * this.props.layout.width
  );

  layoutWidthNode = new Value(this.props.layout.width);

  changeIndexIfNeeded = newIndex => {
    if (this.props.navigationState.index !== newIndex) {
      this.props.onIndexChange(newIndex);
    }
  };

  handleMomentumScrollEnd = ({ nativeEvent }) => {
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
      layout,
      onSwipeStart,
      onSwipeEnd,
      overscroll,
      navigationState,
    } = this.props;

    const handleSwipeStart = ({ nativeEvent }) => {
      this.wasTouched = false;
      onSwipeStart?.(nativeEvent.contentOffset.x);
      this.interactionHandle = InteractionManager.createInteractionHandle();
    };

    const handleSwipeEnd = ({ nativeEvent }) => {
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

    return children({
      addListener: this.addListener,
      jumpTo: this.jumpTo,
      removeListener: this.removeListener,
      render: children => (
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
          onScroll={this.props.scrollHandler}
          onScrollBeginDrag={handleSwipeStart}
          onScrollEndDrag={handleSwipeEnd}
          overScrollMode="never"
          pagingEnabled
          ref={this.scrollViewRef}
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

export default function ScrollPagerWrapperWithScrollHandler(props) {
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
