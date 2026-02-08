import useDimensions from '@/hooks/useDimensions';
import styled from '@/styled-thing';
import { position } from '@/styles';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, SharedValue, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import vstyled from 'styled-components';

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

// TODO osdnk
const Container = vstyled(Animated.View)<{ hasShadow: boolean }>`
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

const ZoomContainer = styled(Animated.View)(({ width, height }: { height: number; width: number }) => ({
  height,
  width,
}));

const MAX_IMAGE_SCALE = 4;
const MIN_IMAGE_SCALE = 1;
const THRESHOLD = 250;

type ZoomableWrapperProps = {
  animationProgress?: SharedValue<number>;
  children: React.ReactNode;
  hasShadow?: boolean;
  horizontalPadding: number;
  aspectRatio: number;
  borderRadius?: number;
  disableAnimations?: boolean;
  disableEnteringWithPinch?: boolean;
  hideStatusBar?: boolean;
  onZoomIn?: () => void;
  onZoomInWorklet?: () => void;
  onZoomOut?: () => void;
  onZoomOutWorklet?: () => void;
  opacity?: SharedValue<number>;
  yOffset?: number;
  xOffset?: number;
  yDisplacement?: SharedValue<number>;
  width?: number;
  height?: number;
};

export const ZoomableWrapper = ({
  animationProgress: givenAnimationProgress,
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
  xOffset: givenXOffset = 0,
  yDisplacement: givenYDisplacement,
  width,
  height,
}: ZoomableWrapperProps) => {
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
  const [containerWidth, containerHeight] = useMemo(() => {
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

    return [maxImageWidth, maxImageWidth];
  }, [aspectRatio, maxImageHeight, maxImageWidth]);

  const [isZoomed, setIsZoomed] = useState(false);
  const isZoomedValue = useSharedValue(false);

  useEffect(() => {
    SystemBars.setStyle('light');
    if (hideStatusBar) {
      if (isZoomed) {
        SystemBars.setHidden({ statusBar: true });
      } else {
        SystemBars.setHidden({ statusBar: false });
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
  const zooming = fullSizeHeight / containerHeight;

  const containerStyle = useAnimatedStyle(() => {
    const scale = 1 + animationProgress.value * (fullSizeHeight / containerHeight - 1);

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
          translateY: (animationProgress.value * (fullSizeHeight - containerHeight)) / 2,
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
  const panContext = useSharedValue({
    numberOfPointers: 0,
    prevTranslateX: 0,
    prevTranslateY: 0,
    startScale: 1,
    startVelocityX: 0,
    startVelocityY: 0,
    startY: 0,
  });
  const pinchContext = useSharedValue({
    blockExitZoom: false,
    focalDisplacementX: 0,
    focalDisplacementY: 0,
    initEventScale: null as number | null,
    maxAllowedFocalDisplacementX: 0,
    maxAllowedFocalDisplacementY: 0,
    prevScale: null as number | null,
    prevTranslateX: 0,
    prevTranslateY: 0,
    startScale: 1,
    startFocalX: 0,
    startFocalY: 0,
    startVelocityX: 0,
    startVelocityY: 0,
  });

  const endGesture = useCallback(
    (event: any, ctx: any) => {
      'worklet';
      ctx.startVelocityX = 0;
      ctx.startVelocityY = 0;
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
      const zooming = fullSizeHeight / containerHeight;

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
      ctx.initEventScale = null;
      ctx.startFocalX = 0;
      ctx.startFocalY = 0;
      ctx.prevScale = null;

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
        if (scale.value * containerWidth >= deviceWidth) {
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
          Math.abs(translateY.value) + (Math.abs(event?.velocityY) ?? 0) - (Math.abs(event?.velocityX / 2) ?? 0) >
            THRESHOLD * targetScale &&
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
        const projectedYCoordinate = targetTranslateY + event.velocityY / 8 / (fullSizeHeight / containerHeight);
        const edgeBounceConfig = {
          damping: 60,
          mass: 2,
          stiffness: 600,
          velocity: event.velocityY / (fullSizeHeight / containerHeight),
        };
        const flingConfig = {
          damping: 120,
          mass: 2,
          stiffness: 600,
          velocity: event.velocityY / (fullSizeHeight / containerHeight),
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
        const projectedXCoordinate = targetTranslateX + event.velocityX / 8 / (fullSizeHeight / containerHeight);
        const edgeBounceConfig = {
          damping: 60,
          mass: 2,
          stiffness: 600,
          velocity: event.velocityX / (fullSizeHeight / containerHeight),
        };
        const flingConfig = {
          damping: 120,
          mass: 2,
          stiffness: 600,
          velocity: event.velocityX / (fullSizeHeight / containerHeight),
        };
        if (projectedXCoordinate > maxDisplacementX) {
          translateX.value = withSpring(maxDisplacementX, edgeBounceConfig);
        } else if (projectedXCoordinate < -maxDisplacementX) {
          translateX.value = withSpring(-maxDisplacementX, edgeBounceConfig);
        } else {
          translateX.value = withSpring(projectedXCoordinate, flingConfig);
        }
      }
    },
    [
      animationProgress,
      containerHeight,
      containerWidth,
      deviceHeightWithMaybeHiddenStatusBar,
      deviceWidth,
      fullSizeHeight,
      fullSizeWidth,
      isZoomedValue,
      onZoomInWorklet,
      onZoomOutWorklet,
      scale,
      translateX,
      translateY,
    ]
  );

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(!disableAnimations && (!disableEnteringWithPinch || isZoomed))
      .maxPointers(2)
      .minPointers(isZoomed ? 1 : 2)
      .onStart(event => {
        const ctx = panContext.value;
        ctx.numberOfPointers = event.numberOfPointers;
        ctx.startScale = scale.value;
        ctx.startVelocityX = event.velocityX;
        ctx.startVelocityY = event.velocityY;
        ctx.startY = translateY.value;
      })
      .onUpdate(event => {
        const ctx = panContext.value;
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
      })
      .onEnd(event => {
        endGesture(event, panContext.value);
      });
  }, [
    deviceHeightWithMaybeHiddenStatusBar,
    disableAnimations,
    disableEnteringWithPinch,
    endGesture,
    fullSizeHeight,
    isZoomed,
    isZoomedValue,
    panContext,
    scale,
    translateX,
    translateY,
    zooming,
  ]);

  const pinchGesture = useMemo(() => {
    return Gesture.Pinch()
      .enabled(!disableAnimations && (!disableEnteringWithPinch || isZoomed))
      .onStart(event => {
        const ctx = pinchContext.value;
        ctx.startScale = scale.value;
        ctx.blockExitZoom = false;
        ctx.focalDisplacementX = (containerWidth / 2 - event.focalX) * scale.value;
        ctx.focalDisplacementY = (containerHeight / 2 - event.focalY) * scale.value;
      })
      .onUpdate(event => {
        const ctx = pinchContext.value;
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
          }

          ctx.prevTranslateX = translateX.value;
          ctx.prevTranslateY = translateY.value;
          ctx.prevScale = event.scale;
        }
      })
      .onEnd(event => {
        endGesture(event, pinchContext.value);
      })
      .simultaneousWithExternalGesture(panGesture);
  }, [
    containerHeight,
    containerWidth,
    disableAnimations,
    disableEnteringWithPinch,
    endGesture,
    isZoomed,
    isZoomedValue.value,
    panGesture,
    pinchContext.value,
    scale,
    translateX,
    translateY,
  ]);

  const singleTapGesture = useMemo(() => {
    return Gesture.Tap()
      .enabled(!disableAnimations)
      .onEnd(event => {
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
      });
  }, [
    animationProgress,
    deviceHeightWithMaybeHiddenStatusBar,
    disableAnimations,
    fullSizeHeight,
    isZoomedValue,
    onZoomInWorklet,
    onZoomOutWorklet,
    scale,
  ]);

  const doubleTapGesture = useMemo(() => {
    return Gesture.Tap()
      .enabled(!disableAnimations && isZoomed)
      .numberOfTaps(2)
      .maxDistance(50)
      .maxDuration(420)
      .onEnd(event => {
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
      });
  }, [
    deviceHeightWithMaybeHiddenStatusBar,
    deviceWidth,
    disableAnimations,
    fullSizeHeight,
    fullSizeWidth,
    isZoomed,
    isZoomedValue,
    scale,
    translateX,
    translateY,
    zooming,
  ]);

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

  const combinedGesture = useMemo(() => {
    // singleTap waits for doubleTap to fail so double-tapping on image doesn't trigger dismiss
    singleTapGesture.requireExternalGestureToFail(doubleTapGesture);
    return Gesture.Simultaneous(panGesture, singleTapGesture);
  }, [doubleTapGesture, panGesture, singleTapGesture]);

  const imageGesture = useMemo(() => {
    doubleTapGesture.requireExternalGestureToFail(pinchGesture);
    return Gesture.Simultaneous(pinchGesture, doubleTapGesture);
  }, [doubleTapGesture, pinchGesture]);

  return (
    <View style={{ alignItems: 'center' }}>
      <GestureDetector gesture={combinedGesture}>
        <ZoomContainer collapsable={false} height={containerHeight} width={containerWidth}>
          <Container hasShadow={hasShadow} style={[containerStyle, StyleSheet.absoluteFillObject]}>
            <GestureDetector gesture={imageGesture}>
              <ImageWrapper collapsable={false} style={[animatedStyle, cornerStyle, StyleSheet.absoluteFillObject]}>
                {children}
              </ImageWrapper>
            </GestureDetector>
          </Container>
        </ZoomContainer>
      </GestureDetector>
    </View>
  );
};
