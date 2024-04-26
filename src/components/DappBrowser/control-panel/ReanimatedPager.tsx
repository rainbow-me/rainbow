import React from 'react';
import { StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  SharedValue,
  useAnimatedGestureHandler,
  withTiming,
} from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AlignVertical, alignVerticalToFlexAlign } from '@/design-system/layout/alignment';
import { deviceUtils } from '@/utils';
import { clamp } from '@/__swaps__/utils/swaps';

const DEVICE_WIDTH = deviceUtils.dimensions.width;

export const ReanimatedPager = React.memo(function ReanimatedPager({
  children,
  enableSwipeGestures = true,
  initialPageIndex = 0,
  pageGap = 12,
  verticalPageAlignment = 'bottom',
}: {
  children: React.ReactElement[];
  enableSwipeGestures?: boolean;
  initialPageIndex?: number;
  pageGap?: number;
  verticalPageAlignment?: AlignVertical;
}) {
  const currentPage = useSharedValue(initialPageIndex);
  const numberOfPages = children.length;

  const pagerWrapperStyle = useAnimatedStyle(() => {
    const totalWidth = numberOfPages * DEVICE_WIDTH + (numberOfPages - 1) * pageGap;
    const translateX = interpolate(currentPage.value, [0, numberOfPages - 1], [0, -totalWidth + DEVICE_WIDTH]);

    return {
      transform: [{ translateX }],
    };
  });

  const swipeGestureHandler = useAnimatedGestureHandler({
    onStart: (event, context: { startX: number; startPage: number }) => {
      context.startPage = currentPage.value;
      context.startX = event.translationX;
    },
    onActive: (event, context: { startX: number; startPage: number }) => {
      const dragDistance = event.translationX - context.startX;
      const dragPages = dragDistance / (DEVICE_WIDTH + pageGap);
      const newPageIndex = clamp(context.startPage - dragPages, 0, numberOfPages - 1);
      currentPage.value = newPageIndex;
    },
    onEnd: event => {
      const swipeVelocityThreshold = 500;
      let targetPage = currentPage.value;

      if (event.velocityX < -swipeVelocityThreshold) {
        targetPage = Math.ceil(currentPage.value);
      } else if (event.velocityX > swipeVelocityThreshold) {
        targetPage = Math.floor(currentPage.value);
      } else {
        targetPage = Math.round(currentPage.value);
      }

      const clampedTargetPage = clamp(targetPage, 0, numberOfPages - 1);
      currentPage.value = withTiming(clampedTargetPage, TIMING_CONFIGS.slowerFadeConfig);
    },
  });

  return (
    // @ts-expect-error Property 'children' does not exist on type
    <PanGestureHandler enabled={enableSwipeGestures} onGestureEvent={swipeGestureHandler}>
      <Animated.View removeClippedSubviews style={styles.pagerContainer}>
        <Animated.View
          removeClippedSubviews
          style={[
            styles.pagerWrapper,
            pagerWrapperStyle,
            {
              justifyContent: verticalPageAlignment ? alignVerticalToFlexAlign[verticalPageAlignment] : undefined,
              gap: pageGap,
              width: numberOfPages * DEVICE_WIDTH + (numberOfPages - 1) * pageGap,
            },
          ]}
        >
          {React.Children.map(children, (child, index) => (
            <Page child={child} currentPage={currentPage} index={index} key={index} verticalPageAlignment={verticalPageAlignment} />
          ))}
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
});

const Page = React.memo(function Page({
  child,
  currentPage,
  index,
  verticalPageAlignment,
}: {
  child: React.ReactElement;
  currentPage: SharedValue<number>;
  index: number;
  verticalPageAlignment: AlignVertical;
}) {
  const pageStyle = useAnimatedStyle(() => {
    const opacity = interpolate(currentPage.value, [index - 1, index, index + 1], [0, 1, 0], 'clamp');
    const scale = interpolate(currentPage.value, [index - 1, index, index + 1], [0.95, 1, 0.95], 'clamp');

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View
      removeClippedSubviews
      style={[styles.pageStyle, pageStyle, { justifyContent: alignVerticalToFlexAlign[verticalPageAlignment] }]}
    >
      {child}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  pageStyle: {
    alignItems: 'center',
    height: '100%',
    overflow: 'hidden',
    width: DEVICE_WIDTH,
  },
  pagerContainer: {
    overflow: 'hidden',
    width: DEVICE_WIDTH,
  },
  pagerWrapper: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
});
