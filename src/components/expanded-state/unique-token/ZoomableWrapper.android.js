import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  useWorkletCallback,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import useReactiveSharedValue from '../../../react-native-animated-charts/src/helpers/useReactiveSharedValue';
import { StatusBarHelper } from '@/helpers';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { position } from '@/styles';

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
  height: ({ height }) => height * 3,
  left: ({ xOffset }) => -xOffset,
  position: 'absolute',
  top: ({ yOffset }) => -yOffset * 3,
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

export const ZoomableWrapper = ({
  animationProgress: givenAnimationProgress,
  children,
  horizontalPadding,
  aspectRatio,
  borderRadius,
  disableAnimations,
  onZoomIn = () => {},
  onZoomInWorklet = () => {
    'worklet';
  },
  onZoomOut = () => {},
  onZoomOutWorklet = () => {
    'worklet';
  },
  opacity,
  yOffset = 85,
  xOffset: givenXOffset = 0,
  yDisplacement: givenYDisplacement,
  width,
  height,
}) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animationProgress = givenAnimationProgress || useSharedValue(0);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const yDisplacement = givenYDisplacement || useSharedValue(0);

  const { height: deviceHeight, width: deviceWidth } = useDimensions();

  const maxImageWidth = width || deviceWidth - horizontalPadding * 2;
  const maxImageHeight = height || deviceHeight / 2;
  const [containerWidth = maxImageWidth, containerHeight = maxImageWidth] = useMemo(() => {
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

  const containerWidthValue = useReactiveSharedValue(containerWidth || maxImageWidth);
  const containerHeightValue = useReactiveSharedValue(containerHeight || maxImageWidth);
  const [isZoomed, setIsZoomed] = useState(false);
  const isZoomedValue = useSharedValue(false);

  useEffect(() => {
    StatusBarHelper.setLightContent();
    if (isZoomed) {
      StatusBarHelper.setHidden(true);
      onZoomIn?.();
    } else {
      StatusBarHelper.setHidden(false);
      onZoomOut?.();
    }
  }, [isZoomed, onZoomIn, onZoomOut]);

  const fullSizeHeight = Math.min(deviceHeight, deviceWidth / aspectRatio);
  const fullSizeWidth = Math.min(deviceWidth, deviceHeight * aspectRatio);

  const xOffset = givenXOffset || (width - containerWidth) / 2 || 0;

  const containerStyle = useAnimatedStyle(() => {
    const scale = 1 + animationProgress.value * (fullSizeHeight / (containerHeightValue.value ?? 1) - 1);

    const maxWidth = (deviceWidth - containerWidth) / 2;
    return {
      opacity: opacity?.value ?? 1,
      transform: [
        {
          translateY: animationProgress.value * (yDisplacement.value + (deviceHeight - fullSizeHeight) / 2 - 85),
        },
        {
          translateY: (animationProgress.value * (fullSizeHeight - containerHeightValue.value)) / 2,
        },
        ...(givenXOffset
          ? [
              {
                translateX: -animationProgress.value * (-maxWidth + givenXOffset),
              },
            ]
          : []),
        {
          scale,
        },
      ],
    };
  }, [fullSizeHeight, fullSizeWidth]);

  const cornerStyle = useAnimatedStyle(() => ({
    borderRadius: (1 - animationProgress.value) * (borderRadius ?? 16),
  }));

  const scale = useSharedValue(1);
  const state = useSharedValue(0); // 0 - started, 1 - finished
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const endGesture = useWorkletCallback((event, ctx) => {
    'worklet';
    state.value = 1;
    const fullSizeHeight = Math.min(deviceHeight, deviceWidth / aspectRatio);
    const fullSizeWidth = Math.min(deviceWidth, deviceHeight * aspectRatio);
    const zooming = fullSizeHeight / containerHeightValue.value;
    ctx.startVelocityX = undefined;
    ctx.startVelocityY = undefined;
    ctx.prevTranslateX = 0;
    ctx.prevTranslateY = 0;
    let targetScale = Math.min(scale.value, MAX_IMAGE_SCALE);

    // determine whether to snap to screen edges
    let breakingScaleX = deviceWidth / fullSizeWidth;
    let breakingScaleY = deviceHeight / fullSizeHeight;

    const maxDisplacementX = (deviceWidth * (Math.max(1, targetScale / breakingScaleX) - 1)) / 2 / zooming;
    const maxDisplacementY = (deviceHeight * (Math.max(1, targetScale / breakingScaleY) - 1)) / 2 / zooming;

    let targetTranslateX = translateX.value;
    let targetTranslateY = translateY.value;

    if (scale.value > MAX_IMAGE_SCALE) {
      scale.value = withTiming(MAX_IMAGE_SCALE, adjustConfig);
      targetScale = MAX_IMAGE_SCALE;
      if (ctx.prevScale) {
        const lastFocalDisplacementX = (ctx.focalDisplacementX * event.scale) / ctx.initEventScale;
        const readjustX = ctx.maxAllowedFocalDisplacementX - lastFocalDisplacementX;
        targetTranslateX = translateX.value + readjustX;
        translateX.value = withTiming(targetTranslateX, adjustConfig);

        const lastFocalDisplacementY = (ctx.focalDisplacementY * event.scale) / ctx.initEventScale;

        const readjustY = ctx.maxAllowedFocalDisplacementY - lastFocalDisplacementY;
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
      if (targetTranslateX > maxDisplacementX) {
        translateX.value = withTiming(maxDisplacementX, adjustConfig);
      }
      if (targetTranslateX < -maxDisplacementX) {
        translateX.value = withTiming(-maxDisplacementX, adjustConfig);
      }
    } else {
      translateX.value = withTiming(0, adjustConfig);
    }

    if (targetScale > breakingScaleY) {
      if (targetTranslateY > maxDisplacementY) {
        cancelAnimation(translateY.value);
        translateY.value = withTiming(maxDisplacementY, adjustConfig);
      }
      if (targetTranslateY < -maxDisplacementY) {
        cancelAnimation(translateY.value);
        translateY.value = withTiming(-maxDisplacementY, adjustConfig);
      }
    } else {
      cancelAnimation(translateY.value);
      translateY.value = withTiming(0, adjustConfig);
    }

    if (scale.value < 0.8) {
      if (ctx.startScale <= MIN_IMAGE_SCALE && !ctx.blockExitZoom) {
        isZoomedValue.value = false;
        runOnJS(setIsZoomed)(false);
        onZoomOutWorklet?.();
        animationProgress.value = withSpring(0, exitConfig);
        scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
        translateX.value = withSpring(0, exitConfig);
        translateY.value = withSpring(0, exitConfig);
      } else {
        scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
        translateX.value = withSpring(0, exitConfig);
        translateY.value = withSpring(0, exitConfig);
        targetScale = 1;
      }
    } else if (scale.value < MIN_IMAGE_SCALE) {
      scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
    }

    // handle dismiss gesture
    if (
      Math.abs(translateY.value) + (Math.abs(event?.velocityY) ?? 0) - (Math.abs(event?.velocityX / 2) ?? 0) > THRESHOLD * targetScale &&
      fullSizeHeight * scale.value <= deviceHeight
    ) {
      isZoomedValue.value = false;
      runOnJS(setIsZoomed)(false);
      onZoomOutWorklet?.();

      scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
      animationProgress.value = withSpring(0, exitConfig);
      translateX.value = withSpring(0, exitConfig);
      translateY.value = withSpring(0, exitConfig);
    }

    if (event.velocityY && isZoomedValue.value && targetScale > breakingScaleX) {
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

    if (event.velocityX && isZoomedValue.value && targetScale > breakingScaleX) {
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
      if (state.value === 1) {
        return;
      }
      const zooming = fullSizeHeight / containerHeightValue.value;
      if (event.numberOfPointers === 2) {
        ctx.numberOfPointers = 2;
      }
      translateX.value += (event.translationX - (ctx.prevTranslateX ?? 0)) / (isZoomedValue.value ? zooming : 1);

      translateY.value += (event.translationY - (ctx.prevTranslateY ?? 0)) / (isZoomedValue.value ? zooming : 1);

      ctx.prevTranslateX = event.translationX;
      ctx.prevTranslateY = event.translationY;
    },
    onCancel: endGesture,
    onEnd: endGesture,
    onFail: endGesture,
    onStart: (event, ctx) => {
      state.value = 0;
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
        ctx.focalDisplacementX = (containerWidthValue.value / 2 - event.focalX) * scale.value;
        ctx.focalDisplacementY = (containerHeightValue.value / 2 - event.focalY) * scale.value;
      }
      if (!ctx.initEventScale) {
        ctx.initEventScale = event.scale;

        const maxAllowedEventScale = (ctx.initEventScale * MAX_IMAGE_SCALE) / scale.value;
        ctx.maxAllowedFocalDisplacementX = (ctx.focalDisplacementX * maxAllowedEventScale) / ctx.initEventScale;
        ctx.maxAllowedFocalDisplacementY = (ctx.focalDisplacementY * maxAllowedEventScale) / ctx.initEventScale;
      }
      if (event.numberOfPointers === 1 || event.numberOfPointers === 2) {
        if (isZoomedValue.value && ctx.startScale <= MIN_IMAGE_SCALE && event.scale > MIN_IMAGE_SCALE) {
          ctx.blockExitZoom = true;
        }
        scale.value = ctx.startScale * (event.scale / ctx.initEventScale);
        if (ctx.prevScale) {
          translateX.value += (ctx.focalDisplacementX * (event.scale - ctx.prevScale)) / ctx.initEventScale;
          translateY.value += (ctx.focalDisplacementY * (event.scale - ctx.prevScale)) / ctx.initEventScale;
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
      state.value = 0;
      ctx.startScale = scale.value;
      ctx.blockExitZoom = false;
      ctx.isNew = true;
    },
  });

  const singleTapGestureHandler = useAnimatedGestureHandler({
    onActive: event => {
      if (!isZoomedValue.value) {
        isZoomedValue.value = true;
        runOnJS(setIsZoomed)(true);
        onZoomInWorklet?.();
        animationProgress.value = withSpring(1, enterConfig);
      } else if (
        scale.value === MIN_IMAGE_SCALE &&
        ((event.absoluteY > 0 && event.absoluteY < (deviceHeight - fullSizeHeight) / 2) ||
          (event.absoluteY <= deviceHeight && event.absoluteY > deviceHeight - (deviceHeight - fullSizeHeight) / 2))
      ) {
        // dismiss if tap was outside image bounds
        isZoomedValue.value = false;
        runOnJS(setIsZoomed)(false);
        onZoomOutWorklet?.();
        animationProgress.value = withSpring(0, exitConfig);
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
    <View style={{ alignItems: 'center' }}>
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
                avgTouches
                enabled={!disableAnimations && isZoomed}
                maxPointers={2}
                onGestureEvent={panGestureHandler}
                ref={pan}
                simultaneousHandlers={[pinch, pan, doubleTap]}
              >
                <ZoomContainer height={containerHeight} width={containerWidth}>
                  <PanGestureHandler>
                    <GestureBlocker
                      height={deviceHeight}
                      pointerEvents={isZoomed ? 'auto' : 'none'}
                      width={deviceWidth}
                      xOffset={xOffset}
                      yOffset={yOffset}
                    />
                  </PanGestureHandler>
                  <Animated.View style={[StyleSheet.absoluteFillObject]}>
                    <Container style={[StyleSheet.absoluteFillObject]}>
                      <PinchGestureHandler
                        enabled={!disableAnimations && isZoomed}
                        onGestureEvent={pinchGestureHandler}
                        ref={pinch}
                        simultaneousHandlers={[pinch, singleTap, pan, doubleTap]}
                      >
                        <ImageWrapper style={[cornerStyle, StyleSheet.absoluteFillObject]}>{children}</ImageWrapper>
                      </PinchGestureHandler>
                    </Container>
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
