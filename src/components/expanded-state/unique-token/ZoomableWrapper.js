import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';
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
import vstyled from 'styled-components';
import useReactiveSharedValue from '../../../react-native-animated-charts/src/helpers/useReactiveSharedValue';
import { ButtonPressAnimation } from '../../animations';
import { StatusBarHelper } from '@/helpers';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { safeAreaInsetValues } from '@/utils';

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
  left: ({ containerWidth, width, xOffset }) => -(xOffset || (width - containerWidth) / 2),
  position: 'absolute',
  top: ({ height }) => -height,
  width: ({ width }) => width,
});

// TODO osdnk
const Container = vstyled(Animated.View)`
  align-self: center;
  ${({ hasShadow, theme: { colors } }) =>
    hasShadow
      ? `
    shadow-color: ${colors.shadowBlack};
    shadow-offset: 0 20px;
    shadow-opacity: 0.4;
    shadow-radius: 30px;
  `
      : ''}
`;

const ImageWrapper = styled(Animated.View)({
  ...position.sizeAsObject('100%'),
  flexDirection: 'row',
  overflow: 'hidden',
});

const ZoomContainer = styled(Animated.View)(({ width, height }) => ({
  height,
  width,
}));

const MAX_IMAGE_SCALE = 4;
const MIN_IMAGE_SCALE = 1;
const THRESHOLD = 250;

export const ZoomableWrapper = ({
  animationProgress: givenAnimationProgress = undefined,
  children,
  hasShadow = true,
  horizontalPadding,
  aspectRatio,
  borderRadius,
  disableAnimations,
  disableEnteringWithPinch,
  hideStatusBar = true,
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

  let deviceHeightWithMaybeHiddenStatusBar = deviceHeight;
  if (!hideStatusBar) {
    deviceHeightWithMaybeHiddenStatusBar = deviceHeight - safeAreaInsetValues.top;
  }

  const maxImageWidth = width || deviceWidth - horizontalPadding * 2;
  const maxImageHeight = height || deviceHeightWithMaybeHiddenStatusBar / 2;
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
    if (hideStatusBar) {
      if (isZoomed) {
        StatusBarHelper.setHidden(true);
      } else {
        StatusBarHelper.setHidden(false);
      }
    }
  }, [hideStatusBar, isZoomed]);

  useEffect(() => {
    if (isZoomed) {
      onZoomIn?.();
    } else {
      onZoomOut?.();
    }
  }, [isZoomed, onZoomIn, onZoomOut]);

  const fullSizeHeight = Math.min(deviceHeightWithMaybeHiddenStatusBar, deviceWidth / aspectRatio);
  const fullSizeWidth = Math.min(deviceWidth, deviceHeightWithMaybeHiddenStatusBar * aspectRatio);
  const zooming = fullSizeHeight / containerHeightValue.value;

  const xOffset = givenXOffset || (width - containerWidth) / 2 || 0;

  const containerStyle = useAnimatedStyle(() => {
    const scale = 1 + animationProgress.value * (fullSizeHeight / (containerHeightValue.value ?? 1) - 1);

    const maxWidth = (deviceWidth - containerWidth) / 2;
    return {
      opacity: opacity?.value ?? 1,
      transform: [
        {
          translateY:
            animationProgress.value *
            (yDisplacement.value + (deviceHeightWithMaybeHiddenStatusBar - fullSizeHeight) / 2 - (hideStatusBar ? 85 : 68)),
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
  }, [fullSizeHeight, fullSizeWidth, hideStatusBar]);

  const cornerStyle = useAnimatedStyle(() => ({
    borderRadius: (1 - animationProgress.value) * (borderRadius ?? 16),
  }));

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const endGesture = useWorkletCallback((event, ctx) => {
    'worklet';
    ctx.startVelocityX = undefined;
    ctx.startVelocityY = undefined;
    ctx.prevTranslateX = 0;
    ctx.prevTranslateY = 0;
    // if zoom state was entered by pinching, adjust targetScale to account for new image dimensions
    let targetScale = isZoomedValue.value
      ? Math.min(scale.value, MAX_IMAGE_SCALE)
      : Math.min(scale.value * (containerWidth / fullSizeWidth), MAX_IMAGE_SCALE);

    // determine whether to snap to screen edges
    let breakingScaleX = deviceWidth / fullSizeWidth;
    let breakingScaleY = deviceHeightWithMaybeHiddenStatusBar / fullSizeHeight;
    if (isZoomedValue.value === false) {
      breakingScaleX = deviceWidth / containerWidth;
      breakingScaleY = deviceHeightWithMaybeHiddenStatusBar / containerHeight;
    }
    const zooming = fullSizeHeight / containerHeightValue.value;

    const maxDisplacementX = (deviceWidth * (Math.max(1, targetScale / breakingScaleX) - 1)) / 2 / zooming;
    const maxDisplacementY = (deviceHeightWithMaybeHiddenStatusBar * (Math.max(1, targetScale / breakingScaleY) - 1)) / 2 / zooming;

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

    if (targetScale > breakingScaleX) {
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
        translateY.value = withTiming(maxDisplacementY, adjustConfig);
      }
      if (targetTranslateY < -maxDisplacementY) {
        translateY.value = withTiming(-maxDisplacementY, adjustConfig);
      }
    } else {
      translateY.value = withTiming(0, adjustConfig);
    }

    if (!isZoomedValue.value) {
      // handle entering zoom state by pinching
      if (scale.value * containerWidthValue.value >= deviceWidth) {
        const adjustedScale = scale.value / (fullSizeWidth / containerWidth);
        isZoomedValue.value = true;
        runOnJS(setIsZoomed)(true);
        onZoomInWorklet?.();
        animationProgress.value = withTiming(1, adjustConfig);
        scale.value = withTiming(adjustedScale, adjustConfig);
      } else {
        scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
        translateX.value = withSpring(0, exitConfig);
        translateY.value = withSpring(0, exitConfig);
        animationProgress.value = withSpring(0, exitConfig);
      }
    } else {
      if (scale.value < MIN_IMAGE_SCALE) {
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
      }

      // handle dismiss gesture
      if (
        Math.abs(translateY.value) + (Math.abs(event?.velocityY) ?? 0) - (Math.abs(event?.velocityX / 2) ?? 0) > THRESHOLD * targetScale &&
        fullSizeHeight * scale.value <= deviceHeightWithMaybeHiddenStatusBar
      ) {
        isZoomedValue.value = false;
        runOnJS(setIsZoomed)(false);
        onZoomOutWorklet?.();
        scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
        animationProgress.value = withSpring(0, exitConfig);
        translateX.value = withSpring(0, exitConfig);
        translateY.value = withSpring(0, exitConfig);
      }
    }

    if (event.velocityY && isZoomedValue.value && targetScale > breakingScaleX) {
      const projectedYCoordinate = targetTranslateY + event.velocityY / 8 / (fullSizeHeight / (containerHeightValue.value ?? 1));
      const edgeBounceConfig = {
        damping: 60,
        mass: 2,
        stiffness: 600,
        velocity: event.velocityY / (fullSizeHeight / (containerHeightValue.value ?? 1)),
      };
      const flingConfig = {
        damping: 120,
        mass: 2,
        stiffness: 600,
        velocity: event.velocityY / (fullSizeHeight / (containerHeightValue.value ?? 1)),
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
      const projectedXCoordinate = targetTranslateX + event.velocityX / 8 / (fullSizeHeight / (containerHeightValue.value ?? 1));
      const edgeBounceConfig = {
        damping: 60,
        mass: 2,
        stiffness: 600,
        velocity: event.velocityX / (fullSizeHeight / (containerHeightValue.value ?? 1)),
      };
      const flingConfig = {
        damping: 120,
        mass: 2,
        stiffness: 600,
        velocity: event.velocityX / (fullSizeHeight / (containerHeightValue.value ?? 1)),
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
      if (isZoomedValue.value && ctx.startScale <= MIN_IMAGE_SCALE && event.numberOfPointers === 1) {
        scale.value =
          ctx.startScale - ((ctx.startY + Math.abs(event.translationY)) / deviceHeightWithMaybeHiddenStatusBar / 2) * ctx.startScale;
      }
      if (event.numberOfPointers === 2) {
        ctx.numberOfPointers = 2;
      }
      translateX.value += (event.translationX - (ctx.prevTranslateX ?? 0)) / (isZoomedValue.value ? zooming : 1);

      // lock y translation on horizontal swipe
      if (
        ctx.startScale <= MIN_IMAGE_SCALE ||
        ctx.startScale * fullSizeHeight >= deviceHeightWithMaybeHiddenStatusBar ||
        ctx.numberOfPointers === 2 ||
        event.numberOfPointers === 2 ||
        !(Math.abs(ctx.startVelocityX) / Math.abs(ctx.startVelocityY) > 1)
      ) {
        translateY.value += (event.translationY - (ctx.prevTranslateY ?? 0)) / (isZoomedValue.value ? zooming : 1);
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
      ctx.startScale = scale.value;
      ctx.blockExitZoom = false;

      ctx.focalDisplacementX = (containerWidthValue.value / 2 - event.focalX) * scale.value;

      ctx.focalDisplacementY = (containerHeightValue.value / 2 - event.focalY) * scale.value;
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
        ((event.absoluteY > 0 && event.absoluteY < (deviceHeightWithMaybeHiddenStatusBar - fullSizeHeight) / 2) ||
          (event.absoluteY <= deviceHeightWithMaybeHiddenStatusBar &&
            event.absoluteY > deviceHeightWithMaybeHiddenStatusBar - (deviceHeightWithMaybeHiddenStatusBar - fullSizeHeight) / 2))
      ) {
        // dismiss if tap was outside image bounds
        isZoomedValue.value = false;
        runOnJS(setIsZoomed)(false);
        onZoomOutWorklet?.();
        animationProgress.value = withSpring(0, exitConfig);
      }
    },
  });

  const doubleTapGestureHandler = useAnimatedGestureHandler({
    onActive: event => {
      if (isZoomedValue.value) {
        if (scale.value > MIN_IMAGE_SCALE) {
          scale.value = withTiming(MIN_IMAGE_SCALE, adjustConfig);
          translateX.value = withTiming(0, adjustConfig);
          translateY.value = withTiming(0, adjustConfig);
        } else {
          // zoom to tapped coordinates and prevent detachment from screen edges
          const centerX = deviceWidth / 2;
          const centerY = deviceHeightWithMaybeHiddenStatusBar / 2;
          const scaleTo = Math.min(Math.max(deviceHeightWithMaybeHiddenStatusBar / fullSizeHeight, 2.5), MAX_IMAGE_SCALE);
          const zoomToX = ((centerX - event.absoluteX) * scaleTo) / zooming;
          const zoomToY = ((centerY - event.absoluteY) * scaleTo) / zooming;

          const breakingScaleX = deviceWidth / fullSizeWidth;
          const breakingScaleY = deviceHeightWithMaybeHiddenStatusBar / fullSizeHeight;
          const maxDisplacementX = (deviceWidth * (Math.max(1, scaleTo / breakingScaleX) - 1)) / 2 / zooming;
          const maxDisplacementY = (deviceHeightWithMaybeHiddenStatusBar * (Math.max(1, scaleTo / breakingScaleY) - 1)) / 2 / zooming;

          if (scaleTo > breakingScaleX) {
            if (zoomToX > maxDisplacementX) {
              translateX.value = withTiming(maxDisplacementX, adjustConfig);
            } else if (zoomToX < -maxDisplacementX) {
              translateX.value = withTiming(-maxDisplacementX, adjustConfig);
            } else {
              translateX.value = withTiming(zoomToX, adjustConfig);
            }
          } else {
            translateX.value = withTiming(0, adjustConfig);
          }

          if (scaleTo > breakingScaleY) {
            if (zoomToY > maxDisplacementY) {
              translateY.value = withTiming(maxDisplacementY, adjustConfig);
            } else if (zoomToY < -maxDisplacementY) {
              translateY.value = withTiming(-maxDisplacementY, adjustConfig);
            } else {
              translateY.value = withTiming(zoomToY, adjustConfig);
            }
          } else {
            translateY.value = withTiming(0, adjustConfig);
          }
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
    <ButtonPressAnimation enableHapticFeedback={false} onPress={() => {}} scaleTo={1} style={{ alignItems: 'center', zIndex: 1 }}>
      <PanGestureHandler
        enabled={!disableAnimations && (!disableEnteringWithPinch || isZoomed)}
        maxPointers={2}
        minPointers={isZoomed ? 1 : 2}
        onGestureEvent={panGestureHandler}
        ref={pan}
        simultaneousHandlers={[pinch]}
      >
        <Animated.View>
          <Animated.View>
            <TapGestureHandler
              enabled={!disableAnimations}
              numberOfTaps={1}
              onHandlerStateChange={singleTapGestureHandler}
              ref={singleTap}
              waitFor={isZoomed && doubleTap}
            >
              <ZoomContainer height={containerHeight} width={containerWidth}>
                <GestureBlocker
                  containerWidth={containerWidth}
                  height={deviceHeightWithMaybeHiddenStatusBar}
                  pointerEvents={isZoomed ? 'auto' : 'none'}
                  width={deviceWidth}
                  xOffset={xOffset}
                  yOffset={yOffset}
                />
                <Animated.View style={[StyleSheet.absoluteFillObject]}>
                  <TapGestureHandler
                    enabled={!disableAnimations && isZoomed}
                    maxDelayMs={420}
                    maxDist={50}
                    maxDurationMs={420}
                    maxPointers={1}
                    numberOfTaps={2}
                    onHandlerStateChange={doubleTapGestureHandler}
                    ref={doubleTap}
                    waitFor={pinch}
                  >
                    <Container hasShadow={hasShadow} style={[containerStyle, StyleSheet.absoluteFillObject]}>
                      <PinchGestureHandler
                        enabled={!disableAnimations && (!disableEnteringWithPinch || isZoomed)}
                        onGestureEvent={pinchGestureHandler}
                        ref={pinch}
                        simultaneousHandlers={[pan]}
                      >
                        <ImageWrapper style={[animatedStyle, cornerStyle, StyleSheet.absoluteFillObject]}>{children}</ImageWrapper>
                      </PinchGestureHandler>
                    </Container>
                  </TapGestureHandler>
                </Animated.View>
              </ZoomContainer>
            </TapGestureHandler>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </ButtonPressAnimation>
  );
};
