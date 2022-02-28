import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  useWorkletCallback,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { tap } from '../../../../e2e/helpers';
import useReactiveSharedValue from '../../../react-native-animated-charts/src/helpers/useReactiveSharedValue';
import { ButtonPressAnimation } from '../../animations';
import { useDimensions } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const adjustConfig = {
  duration: 300,
  easing: Easing.bezier(0.4, 0, 0.22, 1),
};
const enterConfig = {
  damping: 40,
  mass: 1.5,
  stiffness: 600,
};
const exitConfig = {
  damping: 68,
  mass: 2,
  stiffness: 800,
};
const GestureBlocker = styled(View)({
  height: ({ height }) => 2 * height,
  left: ({ containerWidth, width }) => -(width - containerWidth) / 2,
  position: 'absolute',
  top: ({ height }) => -height,
  width: ({ width }) => width,
});

const Container = styled(Animated.View)({
  alignSelf: 'center',
  shadowColor: ({ theme: { colors } }) => colors.shadowBlack,
  shadowOffset: { height: 20, width: 0 },
  shadowOpacity: 0.4,
  shadowRadius: 30,
});

const ImageWrapper = styled(Animated.View)({
  ...position.sizeAsObject('100%'),
  flexDirection: 'row',
  overflow: 'hidden',
});

const ZoomContainer = styled(Animated.View)(({ width, height }) => ({
  height,
  width,
}));

const MAX_IMAGE_SCALE = 3;
const MIN_IMAGE_SCALE = 1;
const THRESHOLD = 250;

const disableAnimations = false;

export const ZoomableWrapper = ({
  animationProgress: givenAnimationProgress,
  children,
  horizontalPadding,
  aspectRatio,
  borderRadius,
  yDisplacement: givenYDisplacement,
}) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animationProgress = givenAnimationProgress || useSharedValue(0);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const yDisplacement = givenYDisplacement || useSharedValue(0);

  const { height: deviceHeight, width: deviceWidth } = useDimensions();

  const maxImageWidth = deviceWidth - horizontalPadding * 2;
  const maxImageHeight = deviceHeight / 2;
  const [
    containerWidth = maxImageWidth,
    containerHeight = maxImageWidth,
  ] = useMemo(() => {
    const isSquare = aspectRatio === 1;
    const isLandscape = aspectRatio > 1;
    const isPortrait = aspectRatio < 1;

    if (isSquare) {
      return [maxImageWidth, maxImageWidth];
    }

    if (isLandscape) {
      return [maxImageWidth, maxImageWidth / aspectRatio];
    }

    if (isPortrait) {
      if (maxImageWidth / aspectRatio > maxImageHeight) {
        return [aspectRatio * maxImageHeight, maxImageHeight];
      } else {
        return [maxImageWidth, maxImageWidth / aspectRatio];
      }
    }
  }, [aspectRatio, maxImageHeight, maxImageWidth]);

  const containerWidthValue = useReactiveSharedValue(
    containerWidth || maxImageWidth
  );
  const containerHeightValue = useReactiveSharedValue(
    containerHeight || maxImageWidth
  );
  const [isZoomed, setIsZoomed] = useState(false);
  const isZoomedValue = useSharedValue(false);

  useEffect(() => {
    if (isZoomed) {
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
    }
  }, [isZoomed]);

  const fullSizeHeight = Math.min(deviceHeight, deviceWidth / aspectRatio);
  const fullSizeWidth = Math.min(deviceWidth, deviceHeight * aspectRatio);

  const containerStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY:
            animationProgress.value *
            (yDisplacement.value + (deviceHeight - fullSizeHeight) / 2 - 85),
        },
        {
          translateY:
            (animationProgress.value *
              (fullSizeHeight - containerHeightValue.value)) /
            2,
        },
        {
          scale:
            1 +
            animationProgress.value *
              (fullSizeHeight / (containerHeightValue.value ?? 1) - 1),
        },
      ],
    }),
    [fullSizeHeight, fullSizeWidth]
  );

  const cornerStyle = useAnimatedStyle(() => ({
    borderRadius: (1 - animationProgress.value) * (borderRadius ?? 16),
  }));

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const endGesture = useWorkletCallback((event, ctx) => {
    'worklet';
    const fullSizeHeight = Math.min(deviceHeight, deviceWidth / aspectRatio);
    const fullSizeWidth = Math.min(deviceWidth, deviceHeight * aspectRatio);
    const zooming = fullSizeHeight / containerHeightValue.value;
    ctx.startVelocityX = undefined;
    ctx.startVelocityY = undefined;
    ctx.prevTranslateX = 0;
    ctx.prevTranslateY = 0;
    // if zoom state was entered by pinching, adjust targetScale to account for new image dimensions
    let targetScale = true // TODO osdnk
      ? Math.min(scale.value, MAX_IMAGE_SCALE)
      : Math.min(
          scale.value * (containerWidth / fullSizeWidth),
          MAX_IMAGE_SCALE
        );

    // determine whether to snap to screen edges
    let breakingScaleX = deviceWidth / fullSizeWidth;
    let breakingScaleY = deviceHeight / fullSizeHeight;
    // if (isZoomedValue.value === false) {
    //   breakingScaleX = deviceWidth / containerWidth;
    //   breakingScaleY = deviceHeight / containerHeight;
    // } // TODO osdnk

    const maxDisplacementX =
      (deviceWidth * (Math.max(1, targetScale / breakingScaleX) - 1)) /
      2 /
      zooming;
    const maxDisplacementY =
      (deviceHeight * (Math.max(1, targetScale / breakingScaleY) - 1)) /
      2 /
      zooming;

    let targetTranslateX = translateX.value;
    let targetTranslateY = translateY.value;

    if (scale.value > MAX_IMAGE_SCALE) {
      console.log("XXXXX - 1")
      scale.value = withTiming(MAX_IMAGE_SCALE, adjustConfig);
      targetScale = MAX_IMAGE_SCALE;
      if (ctx.prevScale) {
        const lastFocalDisplacementX =
          (ctx.focalDisplacementX * event.scale) / ctx.initEventScale;
        const readjustX =
          ctx.maxAllowedFocalDisplacementX - lastFocalDisplacementX;
        targetTranslateX = translateX.value + readjustX;
        translateX.value = withTiming(targetTranslateX, adjustConfig);

        const lastFocalDisplacementY =
          (ctx.focalDisplacementY * event.scale) / ctx.initEventScale;
        const readjustY =
          ctx.maxAllowedFocalDisplacementY - lastFocalDisplacementY;
        targetTranslateY = translateY.value + readjustY;
        translateY.value = withTiming(targetTranslateY, adjustConfig);
      } else {
        return;
      }
    }
    ctx.initEventScale = undefined;
    ctx.startFocalX = undefined;
    ctx.startFocalY = undefined;
    ctx.prevScale = undefined;

    if (targetScale > breakingScaleX && isZoomedValue.value) {
      console.log("XXXXX - 2")

      if (targetTranslateX > maxDisplacementX) {
        translateX.value = withTiming(maxDisplacementX, adjustConfig);
      }
      if (targetTranslateX < -maxDisplacementX) {
        translateX.value = withTiming(-maxDisplacementX, adjustConfig);
      }
    } else {
      console.log("XXXXX - 3", breakingScaleX, aspectRatio, deviceHeight, deviceWidth, fullSizeWidth, isZoomedValue.value)

      translateX.value = withTiming(0, adjustConfig);
    }

    if (targetScale > breakingScaleY) {
      console.log("XXXXX - 4")

      if (targetTranslateY > maxDisplacementY) {
        translateY.value = withTiming(maxDisplacementY, adjustConfig);
      }
      if (targetTranslateY < -maxDisplacementY) {
        translateY.value = withTiming(-maxDisplacementY, adjustConfig);
      }
    } else {
      console.log("XXXXX - 5", breakingScaleY, aspectRatio, deviceHeight)

      translateY.value = withTiming(0, adjustConfig);
    }

    if (false) {
      // handle entering zoom state by pinching
      if (scale.value * containerWidthValue.value >= deviceWidth) {
        const adjustedScale = scale.value / (fullSizeWidth / containerWidth);
        isZoomedValue.value = true;
        runOnJS(setIsZoomed)(true);
        animationProgress.value = withTiming(1, adjustConfig);
        scale.value = withTiming(adjustedScale, adjustConfig);
      } else {
        scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
        translateX.value = withSpring(0, exitConfig);
        translateY.value = withSpring(0, exitConfig);
        animationProgress.value = withSpring(0, exitConfig);
      }
    } else {
      if (scale.value < 0.8) {
        if (ctx.startScale <= MIN_IMAGE_SCALE && !ctx.blockExitZoom) {
          isZoomedValue.value = false;
          runOnJS(setIsZoomed)(false);
          animationProgress.value = withSpring(0, exitConfig);
          console.log("XXX - v2")
          scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
          translateX.value = withSpring(0, exitConfig);
          translateY.value = withSpring(0, exitConfig);
        } else {
          console.log("XXX - v3")
          scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
          translateX.value = withSpring(0, exitConfig);
          translateY.value = withSpring(0, exitConfig);
          targetScale = 1;
        }
      } else if (scale.value < MIN_IMAGE_SCALE) {
        console.log("XXX - v4", scale.value)

        scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
      }

      // handle dismiss gesture
      if (
        Math.abs(translateY.value) +
          (Math.abs(event?.velocityY) ?? 0) -
          (Math.abs(event?.velocityX / 2) ?? 0) >
          THRESHOLD * targetScale &&
        fullSizeHeight * scale.value <= deviceHeight
      ) {
        console.log("XXXXX - 6")

        isZoomedValue.value = false;
        runOnJS(setIsZoomed)(false);
        console.log("XXX - v5")

        scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
        animationProgress.value = withSpring(0, exitConfig);
        translateX.value = withSpring(0, exitConfig);
        translateY.value = withSpring(0, exitConfig);
      }
    }

    return
    if (
      event.velocityY &&
      isZoomedValue.value &&
      targetScale > breakingScaleX
    ) {
      console.log("XXXXX - 7")

      const projectedYCoordinate = targetTranslateY + event.velocityY / 8;
      const edgeBounceConfig = {
        damping: 60,
        mass: 2,
        stiffness: 600,
        velocity: event.velocityY,
      };
      const flingConfig = {
        damping: 120,
        mass: 2,
        stiffness: 600,
        velocity: event.velocityY,
      };
      if (projectedYCoordinate > maxDisplacementY) {
        translateY.value = withSpring(maxDisplacementY, edgeBounceConfig);
      } else if (projectedYCoordinate < -maxDisplacementY) {
        translateY.value = withSpring(-maxDisplacementY, edgeBounceConfig);
      } else {
        translateY.value = withSpring(projectedYCoordinate, flingConfig);
      }
    }

    if (
      event.velocityX &&
      isZoomedValue.value &&
      targetScale > breakingScaleX
    ) {
      console.log("XXXXX - 8")

      const projectedXCoordinate = targetTranslateX + event.velocityX / 8;
      const edgeBounceConfig = {
        damping: 60,
        mass: 2,
        stiffness: 600,
        velocity: event.velocityX,
      };
      const flingConfig = {
        damping: 120,
        mass: 2,
        stiffness: 600,
        velocity: event.velocityX,
      };
      if (projectedXCoordinate > maxDisplacementX) {
        translateX.value = withSpring(maxDisplacementX, edgeBounceConfig);
      } else if (projectedXCoordinate < -maxDisplacementX) {
        translateX.value = withSpring(-maxDisplacementX, edgeBounceConfig);
      } else {
        translateX.value = withSpring(projectedXCoordinate, flingConfig);
      }
    }
  });

  const panGestureHandler = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      const zooming = Math.pow(fullSizeHeight / containerHeightValue.value, 2);
      if (
        isZoomedValue.value &&
        ctx.startScale <= MIN_IMAGE_SCALE &&
        event.numberOfPointers === 1
      ) {
        // scale.value =
        //   ctx.startScale -
        //   ((ctx.startY + Math.abs(event.translationY)) / deviceHeight / 2) *
        //     ctx.startScale;
        // console.log("GGGGG")
      }
      if (event.numberOfPointers === 2) {
        ctx.numberOfPointers = 2;
      }
      translateX.value +=
        (event.translationX - (ctx.prevTranslateX ?? 0)) /
        (isZoomedValue.value ? zooming : 1);

      // lock y translation on horizontal swipe
      if (
        true
        // ctx.startScale <= MIN_IMAGE_SCALE ||
        // ctx.startScale * fullSizeHeight >= deviceHeight ||
        // ctx.numberOfPointers === 2 ||
        // event.numberOfPointers === 2 ||
        // !(Math.abs(ctx.startVelocityX) / Math.abs(ctx.startVelocityY) > 1)
      ) {
        translateY.value +=
          (event.translationY - (ctx.prevTranslateY ?? 0)) /
          (isZoomedValue.value ? zooming : 1);
      }

      ctx.prevTranslateX = event.translationX;
      ctx.prevTranslateY = event.translationY;
    },
    onCancel: endGesture,
    onEnd: endGesture,
    onFail: endGesture,
    onStart: (event, ctx) => {
      ctx.numberOfPointers = event.numberOfPointers;
      ctx.startScale = scale.value;
      ctx.startVelocityX = event.velocityX;
      ctx.startVelocityY = event.velocityY;
      ctx.startY = translateY.value;
    },
  });

  const pinchGestureHandler = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      if (ctx.isNew) {
        ctx.isNew = false;
        ctx.focalDisplacementX =
          (containerWidthValue.value / 2 - event.focalX) * scale.value;
        ctx.focalDisplacementY =
          (containerHeightValue.value / 2 - event.focalY) * scale.value;
      }
      if (!ctx.initEventScale) {
        ctx.initEventScale = event.scale;

        const maxAllowedEventScale =
          (ctx.initEventScale * MAX_IMAGE_SCALE) / scale.value;
        ctx.maxAllowedFocalDisplacementX =
          (ctx.focalDisplacementX * maxAllowedEventScale) / ctx.initEventScale;
        ctx.maxAllowedFocalDisplacementY =
          (ctx.focalDisplacementY * maxAllowedEventScale) / ctx.initEventScale;
      }
      if (event.numberOfPointers === 1 || event.numberOfPointers === 2) {
        if (
          isZoomedValue.value &&
          ctx.startScale <= MIN_IMAGE_SCALE &&
          event.scale > MIN_IMAGE_SCALE
        ) {
          ctx.blockExitZoom = true;
        }
        scale.value = ctx.startScale * (event.scale / ctx.initEventScale);
        console.log("XXX -h", scale.value)
        if (ctx.prevScale) {
          translateX.value +=
            (ctx.focalDisplacementX * (event.scale - ctx.prevScale)) /
            ctx.initEventScale;
          translateY.value +=
            (ctx.focalDisplacementY * (event.scale - ctx.prevScale)) /
            ctx.initEventScale;
        } else {
          ctx.startScale2 = scale.value;
        }

        ctx.prevTranslateX = translateX.value;
        ctx.prevTranslateY = translateY.value;
        ctx.prevScale = event.scale;
      }
    },
    onCancel: endGesture,
    onEnd: endGesture,
    onFail: endGesture,
    onFinish: endGesture,
    onStart: (event, ctx) => {
      ctx.startScale = scale.value;
      ctx.blockExitZoom = false;
      ctx.isNew = true;

      console.log(event.focalX, event.focalY, 'XY', event);
      ctx.focalDisplacementX = -event.focalX * scale.value;

      ctx.focalDisplacementY = event.focalY * scale.value;
    },
  });

  const singleTapGestureHandler = useAnimatedGestureHandler({
    onActive: event => {
      console.log('SDF');
      if (!isZoomedValue.value) {
        isZoomedValue.value = true;
        runOnJS(setIsZoomed)(true);
        animationProgress.value = withSpring(1, enterConfig);
      } else if (
        scale.value === MIN_IMAGE_SCALE &&
        ((event.absoluteY > 0 &&
          event.absoluteY < (deviceHeight - fullSizeHeight) / 2) ||
          (event.absoluteY <= deviceHeight &&
            event.absoluteY >
              deviceHeight - (deviceHeight - fullSizeHeight) / 2))
      ) {
        // dismiss if tap was outside image bounds
        isZoomedValue.value = false;
        runOnJS(setIsZoomed)(false);
        animationProgress.value = withSpring(0, exitConfig);
      }
    },
  });

  const doubleTapGestureHandler = useAnimatedGestureHandler({
    onActive: event => {
      const zooming = fullSizeHeight / containerHeightValue.value;
      if (isZoomedValue.value) {
        if (scale.value > MIN_IMAGE_SCALE) {
          scale.value = withTiming(MIN_IMAGE_SCALE, adjustConfig);
          translateX.value = withTiming(0, adjustConfig);
          translateY.value = withTiming(0, adjustConfig);
        } else {
          // zoom to tapped coordinates and prevent detachment from screen edges
          const centerX = deviceWidth / 2;
          const centerY = deviceHeight / 2;
          const scaleTo = Math.min(
            Math.max(deviceHeight / fullSizeHeight, 2.5),
            MAX_IMAGE_SCALE
          );
          const zoomToX = ((centerX - event.absoluteX) * scaleTo) / zooming;
          const zoomToY = ((centerY - event.absoluteY) * scaleTo) / zooming;

          const breakingScaleX = deviceWidth / fullSizeWidth;
          const breakingScaleY = deviceHeight / fullSizeHeight;
          const maxDisplacementX =
            (deviceWidth * (Math.max(1, scaleTo / breakingScaleX) - 1)) /
            2 /
            zooming;
          const maxDisplacementY =
            (deviceHeight * (Math.max(1, scaleTo / breakingScaleY) - 1)) /
            2 /
            zooming;
          //
          // if (scaleTo > breakingScaleX) {
          //   if (zoomToX > maxDisplacementX) {
          //     translateX.value = withTiming(maxDisplacementX, adjustConfig);
          //   } else if (zoomToX < -maxDisplacementX) {
          //     translateX.value = withTiming(-maxDisplacementX, adjustConfig);
          //   } else {
          //     translateX.value = withTiming(zoomToX, adjustConfig);
          //   }
          // } else {
          //   translateX.value = withTiming(0, adjustConfig);
          // }
          //
          // if (scaleTo > breakingScaleY) {
          //   if (zoomToY > maxDisplacementY) {
          //     translateY.value = withTiming(maxDisplacementY, adjustConfig);
          //   } else if (zoomToY < -maxDisplacementY) {
          //     translateY.value = withTiming(-maxDisplacementY, adjustConfig);
          //   } else {
          //     translateY.value = withTiming(zoomToY, adjustConfig);
          //   }
          // } else {
          //   translateY.value = withTiming(0, adjustConfig);
          // }
          scale.value = withTiming(scaleTo, adjustConfig);
        }
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translateX.value,
        },
        {
          translateY: translateY.value,
        },
        {
          scale: scale.value,
        },
      ],
    };
  });

  const pan = useRef();
  const pinch = useRef();
  const doubleTap = useRef();
  const singleTap = useRef();

  return (
    <View style={{ alignItems: 'center', zIndex: 10, backgroundColor:"red" }}>
      <Animated.View style={[containerStyle]}>
        <Animated.View style={[animatedStyle]}>
        <TapGestureHandler
          enabled={!disableAnimations}
          numberOfTaps={1}
          onHandlerStateChange={singleTapGestureHandler}
          ref={singleTap}
          simultaneousHandlers={[pinch, singleTap, doubleTap]}
          waitFor={pan}
        >
          <Animated.View>

            <PanGestureHandler
              // activeOffsetX={[-0.01, 0.01]}
              // activeOffsetY={[-0.01, 0.01]}
              // minPointers={isZoomed ? 1 : 2}
              enabled={!disableAnimations && isZoomed}
              maxPointers={2}
              onGestureEvent={panGestureHandler}
              ref={pan}
              simultaneousHandlers={[pinch, pan, doubleTap]}
            >
              <ZoomContainer height={containerHeight} width={containerWidth}>
                <PanGestureHandler>

                <GestureBlocker
                  containerHeight={containerHeight}
                  containerWidth={containerWidth}
                  height={deviceHeight}
                  pointerEvents={isZoomed ? 'auto' : 'none'}
                  width={deviceWidth}
                />
                </PanGestureHandler>
                <Animated.View style={[StyleSheet.absoluteFillObject]}>
                  {/*<TapGestureHandler*/}
                  {/*  enabled={!disableAnimations && isZoomed}*/}
                  {/*  maxDelayMs={420}*/}
                  {/*  maxDist={50}*/}
                  {/*  maxDurationMs={420}*/}
                  {/*  maxPointers={1}*/}
                  {/*  numberOfTaps={2}*/}
                  {/*  onHandlerStateChange={doubleTapGestureHandler}*/}
                  {/*  ref={doubleTap}*/}
                  {/*  waitFor={pinch}*/}
                  {/*  simultaneousHandlers={[pinch, singleTap, pan, doubleTap]}*/}
                  {/*>*/}
                  <Container style={[StyleSheet.absoluteFillObject]}>
                    <PinchGestureHandler
                      enabled={!disableAnimations&& isZoomed}
                      onGestureEvent={pinchGestureHandler}
                      ref={pinch}
                      simultaneousHandlers={[pinch, singleTap, pan, doubleTap]}
                    >
                    <ImageWrapper
                      style={[cornerStyle, StyleSheet.absoluteFillObject, { backgroundColor: 'blue' }]}
                    >
                      {children}
                    </ImageWrapper>

                    </PinchGestureHandler>
                  </Container>
                  {/*</TapGestureHandler>*/}
                </Animated.View>
              </ZoomContainer>
            </PanGestureHandler>
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
      </Animated.View>
    </View>
  );
};
