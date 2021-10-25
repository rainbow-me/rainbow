import React from 'react';
import { StatusBar, View } from 'react-native';
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
import styled from 'styled-components';
import useReactiveSharedValue from '../../../react-native-animated-charts/src/helpers/useReactiveSharedValue';
import { ButtonPressAnimation } from '../../animations';
import { useDimensions } from '@rainbow-me/hooks';
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
const GestureBlocker = styled(View)`
  height: ${({ height }) => height};
  left: ${({ containerWidth, width }) => -(width - containerWidth) / 2};
  position: absolute;
  top: -85;
  width: ${({ width }) => width};
`;
const Container = styled(Animated.View)`
  align-self: center;
  shadow-color: ${({ theme: { colors } }) => colors.shadowBlack};
  shadow-offset: 0 20px;
  shadow-opacity: 0.4;
  shadow-radius: 30px;
`;
const ImageWrapper = styled(Animated.View)`
  ${position.size('100%')};
  overflow: hidden;
  flex-direction: row;
`;
const ZoomContainer = styled(Animated.View)`
  height: ${({ height }) => height};
  width: ${({ width }) => width};
`;

const MAX_IMAGE_SCALE = 4;
const MIN_IMAGE_SCALE = 1;
const THRESHOLD = 250;

export const ZoomableWrapper = ({
  animationProgress: givenAnimationProgress,
  children,
  horizontalPadding,
  aspectRatio,
  isENS,
  isSVG,
  borderRadius,
  disableAnimations,
  yDisplacement,
}) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animationProgress = givenAnimationProgress || useSharedValue(0);

  const { height: deviceHeight, width: deviceWidth } = useDimensions();

  const maxImageWidth = deviceWidth - horizontalPadding * 2;
  const maxImageHeight = deviceHeight / 2;
  const [
    containerWidth = maxImageWidth,
    containerHeight = maxImageWidth,
  ] = useMemo(() => {
    const isSquare = aspectRatio === 1 || isENS;
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
  }, [aspectRatio, isENS, maxImageHeight, maxImageWidth]);

  const containerWidthValue = useReactiveSharedValue(
    containerWidth || maxImageWidth
  );
  const containerHeightValue = useReactiveSharedValue(
    containerHeight || maxImageWidth
  );
  const [isZoomed, setIsZoomed] = useState(false);
  const isZoomedValue = useSharedValue(false);

  // disable pinch when one finger is lifted
  const [pinchEnabled, setPinchEnabledState] = useState(true);
  useEffect(() => {
    if (!pinchEnabled) {
      setPinchEnabledState(true);
    }
  }, [pinchEnabled]);
  const disablePinch = useCallback(() => {
    setPinchEnabledState(false);
  }, []);

  useEffect(() => {
    if (isZoomed) {
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
    }
  }, [isZoomed]);

  const fullSizeHeight = Math.min(deviceHeight, deviceWidth / aspectRatio);
  const fullSizeWidth = Math.min(deviceWidth, deviceHeight * aspectRatio);

  const containerStyle = useAnimatedStyle(() => ({
    height:
      containerHeightValue.value +
      animationProgress.value * (fullSizeHeight - containerHeightValue.value),
    transform: [
      {
        translateY:
          animationProgress.value *
          (yDisplacement.value + (deviceHeight - fullSizeHeight) / 2 - 85),
      },
    ],
    width:
      containerWidthValue.value +
      animationProgress.value * (fullSizeWidth - containerWidthValue.value),
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    borderRadius: (1 - animationProgress.value) * (borderRadius ?? 16),
  }));

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const endGesture = useWorkletCallback((event, ctx) => {
    'worklet';
    ctx.initEventScale = undefined;
    ctx.prevScale = undefined;
    ctx.prevTranslateX = 0;
    ctx.prevTranslateY = 0;

    // if zoom state was entered by pinching, adjust targetScale to account for new image dimensions
    let targetScale = isZoomed
      ? Math.min(scale.value, MAX_IMAGE_SCALE)
      : Math.min(
          scale.value * (containerWidth / fullSizeWidth),
          MAX_IMAGE_SCALE
        );

    // determine whether to snap to screen edges
    let breakingScaleX = deviceWidth / fullSizeWidth;
    let breakingScaleY = deviceHeight / fullSizeHeight;
    if (isZoomedValue.value === false) {
      breakingScaleX = deviceWidth / containerWidth;
      breakingScaleY = deviceHeight / containerHeight;
    }

    if (targetScale > breakingScaleX) {
      const maxDisplacementX =
        (deviceWidth * (targetScale / breakingScaleX - 1)) / 2;
      if (translateX.value > maxDisplacementX) {
        translateX.value = withTiming(maxDisplacementX, adjustConfig);
      }
      if (translateX.value < -maxDisplacementX) {
        translateX.value = withTiming(-maxDisplacementX, adjustConfig);
      }
    } else {
      translateX.value = withTiming(0, adjustConfig);
    }

    if (targetScale > breakingScaleY) {
      const maxDisplacementY =
        (deviceHeight * (targetScale / breakingScaleY - 1)) / 2;
      if (translateY.value > maxDisplacementY) {
        translateY.value = withTiming(maxDisplacementY, adjustConfig);
      }
      if (translateY.value < -maxDisplacementY) {
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
        Math.abs(translateY.value) +
          (Math.abs(event?.velocityY) ?? 0) -
          (Math.abs(event?.velocityX / 2) ?? 0) >
          THRESHOLD * targetScale &&
        fullSizeHeight * scale.value <= deviceHeight
      ) {
        isZoomedValue.value = false;
        runOnJS(setIsZoomed)(false);
        scale.value = withSpring(MIN_IMAGE_SCALE, exitConfig);
        translateX.value = withSpring(0, exitConfig);
        translateY.value = withSpring(0, exitConfig);
        animationProgress.value = withSpring(0, exitConfig);
      }
    }

    if (scale.value > MAX_IMAGE_SCALE) {
      scale.value = withTiming(MAX_IMAGE_SCALE, adjustConfig);
      targetScale = MAX_IMAGE_SCALE;
    }
  });

  const panGestureHandler = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      if (ctx.startScale <= MIN_IMAGE_SCALE) {
        scale.value =
          ctx.startScale -
          ((ctx.startY + Math.abs(event.translationY)) / deviceHeight / 2) *
            ctx.startScale;
      }
      translateX.value += event.translationX - (ctx.prevTranslateX ?? 0);
      translateY.value += event.translationY - (ctx.prevTranslateY ?? 0);
      ctx.prevTranslateX = event.translationX;
      ctx.prevTranslateY = event.translationY;
    },
    onCancel: endGesture,
    onEnd: endGesture,
    onFail: endGesture,
    onStart: (_, ctx) => {
      ctx.startScale = scale.value;
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
  });

  const blockingPanGestureHandler = useAnimatedGestureHandler({
    onActive: () => {},
    onCancel: () => {},
    onEnd: () => {},
    onFail: () => {},
    onStart: () => {},
  });

  const pinchGestureHandler = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      if (!ctx.initEventScale) {
        ctx.initEventScale = event.scale;
      }
      if (event.numberOfPointers === 2) {
        if (
          isZoomedValue.value &&
          ctx.startScale <= MIN_IMAGE_SCALE &&
          event.scale > MIN_IMAGE_SCALE
        ) {
          ctx.blockExitZoom = true;
        }
        scale.value = ctx.startScale * (event.scale / ctx.initEventScale);
        translateX.value = ctx.startX + (event.focalX - ctx.startFocalX);
        translateY.value = ctx.startY + (event.focalY - ctx.startFocalY);
        ctx.prevTranslateX = translateX.value;
        ctx.prevTranslateY = translateY.value;
        ctx.prevScale = event.scale;
      } else if (event.numberOfPointers !== 2) {
        translateX.value = ctx.prevTranslateX;
        translateY.value = ctx.prevTranslateY;
        runOnJS(disablePinch)();
      }
    },
    onCancel: endGesture,
    onEnd: endGesture,
    onFail: endGesture,
    onFinish: endGesture,
    onStart: (event, ctx) => {
      ctx.startScale = scale.value;
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
      ctx.startFocalX = event.focalX;
      ctx.startFocalY = event.focalY;
      ctx.blockExitZoom = false;
    },
  });

  const singleTapGestureHandler = useAnimatedGestureHandler({
    onActive: event => {
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
          const zoomToX = (centerX - event.absoluteX) * scaleTo;
          const zoomToY = (centerY - event.absoluteY) * scaleTo;

          const breakingScaleX = deviceWidth / fullSizeWidth;
          const breakingScaleY = deviceHeight / fullSizeHeight;

          if (scaleTo > breakingScaleX) {
            const maxDisplacementX =
              (deviceWidth * (scaleTo / breakingScaleX - 1)) / 2;
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
            const maxDisplacementY =
              (deviceHeight * (scaleTo / breakingScaleY - 1)) / 2;
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
          // SVGs don't resize when given a new width and height, so scale them up to compensate
          scale: isSVG
            ? scale.value +
              animationProgress.value *
                ((fullSizeWidth / containerWidth) * scale.value - scale.value)
            : scale.value,
        },
      ],
    };
  });

  const blockingPan = useRef();
  const pan = useRef();
  const pinch = useRef();
  const doubleTap = useRef();
  const singleTap = useRef();

  return (
    <ButtonPressAnimation
      disabled={disableAnimations}
      enableHapticFeedback={false}
      onPress={() => {}}
      scaleTo={1}
      style={{ alignItems: 'center', zIndex: 10 }}
    >
      <PanGestureHandler
        enabled={!disableAnimations}
        maxPointers={5}
        minPointers={2}
        onGestureEvent={blockingPanGestureHandler}
        ref={blockingPan}
        simultaneousHandlers={[pan, pinch, doubleTap, singleTap]}
        waitFor={[pinch, doubleTap, singleTap]}
      >
        <Animated.View>
          <PanGestureHandler
            enabled={!disableAnimations && isZoomed}
            maxPointers={1}
            onGestureEvent={panGestureHandler}
            ref={pan}
            simultaneousHandlers={[blockingPan]}
          >
            <Animated.View>
              <PinchGestureHandler
                enabled={!disableAnimations && pinchEnabled}
                onGestureEvent={pinchGestureHandler}
                ref={pinch}
                simultaneousHandlers={[blockingPan]}
              >
                <Animated.View>
                  <TapGestureHandler
                    numberOfTaps={1}
                    onHandlerStateChange={singleTapGestureHandler}
                    ref={singleTap}
                    simultaneousHandlers={[blockingPan]}
                    waitFor={isZoomed && doubleTap}
                  >
                    <ZoomContainer
                      height={containerHeight}
                      width={containerWidth}
                    >
                      <GestureBlocker
                        containerHeight={containerHeight}
                        containerWidth={containerWidth}
                        height={deviceHeight}
                        pointerEvents={isZoomed ? 'auto' : 'none'}
                        width={deviceWidth}
                      />
                      <Animated.View>
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
                          <Container style={[containerStyle]}>
                            <ImageWrapper style={[animatedStyle, cornerStyle]}>
                              {children}
                            </ImageWrapper>
                          </Container>
                        </TapGestureHandler>
                      </Animated.View>
                    </ZoomContainer>
                  </TapGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </ButtonPressAnimation>
  );
};
