import { toLower } from 'lodash';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PixelRatio,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  useWorkletCallback,
  withSpring,
} from 'react-native-reanimated';
import styled from 'styled-components';
import useReactiveSharedValue from '../../../react-native-animated-charts/src/helpers/useReactiveSharedValue';
import { ENS_NFT_CONTRACT_ADDRESS } from '../../../references';
import { magicMemo } from '../../../utils';
import { SimpleModelView } from '../../3d';
import { ButtonPressAnimation } from '../../animations';
import { AudioPlayer } from '../../audio';
import { UniqueTokenImage } from '../../unique-token';
import { CardSize } from '../../unique-token/CardSize';
import { SimpleVideo } from '../../video';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import {
  useDimensions,
  usePersistentAspectRatio,
  useUniqueToken,
} from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const pixelRatio = PixelRatio.get();

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

const ModelView = styled(SimpleModelView)`
  ${position.size('100%')};
`;

const LoadingWrapper = styled(View)`
  align-items: flex-end;
  height: 100%;
  justify-content: flex-end;
  padding-bottom: 10;
  padding-right: 10;
  position: absolute;
`;

const ZoomContainer = styled(Animated.View)`
  height: ${({ height }) => height};
  width: ${({ width }) => width};
`;

const THRESHOLD = 500;

const ZoomableWrapper = ({
  animationProgress: givenAnimationProgress,
  children,
  horizontalPadding,
  aspectRatio,
  isENS,
  borderRadius,
  disableAnimations,
  onZoomIn,
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
  const yPosition = useSharedValue(0);

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

  const containerStyle = useAnimatedStyle(() => ({
    height:
      containerHeightValue.value +
      animationProgress.value * (fullSizeHeight - containerHeightValue.value),
    marginBottom:
      -animationProgress.value * (fullSizeHeight - containerHeightValue.value),
    transform: [
      {
        translateY:
          yPosition.value +
          animationProgress.value * ((deviceHeight - fullSizeHeight) / 2 - 85),
      },
    ],
    width:
      containerWidthValue.value +
      animationProgress.value * (fullSizeWidth - containerWidthValue.value),
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderRadius: (1 - animationProgress.value) * (borderRadius ?? 16),
  }));

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const endGesture = useWorkletCallback((event, ctx) => {
    'worklet';
    let targetScale = scale.value;
    ctx.prevScale = undefined;
    ctx.prevTranslateX = 0;
    ctx.prevTranslateY = 0;
    if (scale.value < 1) {
      if (ctx.start <= 1) {
        isZoomedValue.value = false;
        runOnJS(setIsZoomed)(false);
        animationProgress.value = withSpring(0, exitConfig);
        scale.value = withSpring(1, exitConfig);
        translateX.value = withSpring(0, exitConfig);
        translateY.value = withSpring(0, exitConfig);
      } else {
        scale.value = withSpring(1, exitConfig);
        translateX.value = withSpring(0, exitConfig);
        translateY.value = withSpring(0, exitConfig);
        targetScale = 1;
      }
    }

    ctx.initEventScale = undefined;

    if (scale.value > 3) {
      scale.value = withSpring(3, exitConfig);
      targetScale = 3;
    }

    const breakingScaleX = deviceWidth / fullSizeWidth;
    const breakingScaleY = deviceHeight / fullSizeHeight;

    if (targetScale > breakingScaleX) {
      const maxDisplacementX =
        (deviceWidth * (targetScale / breakingScaleX - 1)) / 2;
      if (translateX.value > maxDisplacementX) {
        translateX.value = withSpring(maxDisplacementX, exitConfig);
      }
      if (translateX.value < -maxDisplacementX) {
        translateX.value = withSpring(-maxDisplacementX, exitConfig);
      }
    } else {
      translateX.value = withSpring(0, exitConfig);
    }

    if (targetScale > breakingScaleY) {
      const maxDisplacementY =
        (deviceHeight * (targetScale / breakingScaleY - 1)) / 2;
      if (translateY.value > maxDisplacementY) {
        translateY.value = withSpring(maxDisplacementY, exitConfig);
      }
      if (translateY.value < -maxDisplacementY) {
        translateY.value = withSpring(-maxDisplacementY, exitConfig);
      }
    } else {
      translateY.value = withSpring(0, exitConfig);
    }

    if (
      Math.abs(translateY.value) + 3 * (Math.abs(event?.velocityY) ?? 0) >
        THRESHOLD * Math.pow(targetScale, 5) &&
      fullSizeHeight * scale.value < deviceHeight
    ) {
      isZoomedValue.value = false;
      runOnJS(setIsZoomed)(false);
    }
    if (!isZoomedValue.value) {
      scale.value = withSpring(1, exitConfig);
      animationProgress.value = withSpring(0, exitConfig);
      translateX.value = withSpring(0, exitConfig);
      translateY.value = withSpring(0, exitConfig);
    }
  });

  const panGestureHandler = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      if (fullSizeHeight * ctx.startScale < deviceHeight) {
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

  const pinchGestureHandler = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      if (!ctx.initEventScale) {
        ctx.initEventScale = event.scale;
      }

      scale.value = ctx.start * (event.scale / ctx.initEventScale);
      if (ctx.prevScale) {
        const delta = event.scale / ctx.prevScale;
        translateX.value +=
          (delta - 1) * (containerWidthValue.value / 2 - event.focalX);
      }
      ctx.prevScale = event.scale;
    },
    onEnd: endGesture,
    onStart: (_, ctx) => {
      ctx.start = scale.value;
    },
  });

  const singleTapGestureHandler = useAnimatedGestureHandler({
    onActive: () => {
      if (!isZoomedValue.value) {
        isZoomedValue.value = true;
        runOnJS(setIsZoomed)(true);
        runOnJS(onZoomIn)();
        animationProgress.value = withSpring(1, enterConfig);
      }
    },
  });

  const doubleTapGestureHandler = useAnimatedGestureHandler({
    onActive: () => {
      if (isZoomedValue.value) {
        isZoomedValue.value = false;
        runOnJS(setIsZoomed)(false);
        animationProgress.value = withSpring(0, exitConfig);
        scale.value = withSpring(1, exitConfig);
        translateX.value = withSpring(0, exitConfig);
        translateY.value = withSpring(0, exitConfig);
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
    <ButtonPressAnimation
      disabled={disableAnimations}
      enableHapticFeedback={false}
      onPress={() => {}}
      scaleTo={1}
      style={{ alignItems: 'center', zIndex: 10 }}
    >
      <PanGestureHandler
        enabled={!disableAnimations && isZoomed}
        maxPointers={5}
        onGestureEvent={panGestureHandler}
        ref={pan}
        simultaneousHandlers={[pinch, doubleTap, singleTap]}
      >
        <ZoomContainer height={containerHeight} width={containerWidth}>
          <GestureBlocker
            containerHeight={containerHeight}
            containerWidth={containerWidth}
            height={deviceHeight}
            pointerEvents={isZoomed ? 'auto' : 'none'}
            width={deviceWidth}
          />
          <TapGestureHandler
            enabled={!disableAnimations && !isZoomed}
            numberOfTaps={1}
            onHandlerStateChange={singleTapGestureHandler}
            ref={singleTap}
            simultaneousHandlers={[pinch, pan, singleTap]}
          >
            <Animated.View>
              <TapGestureHandler
                enabled={!disableAnimations && isZoomed}
                maxDurationMs={200}
                numberOfTaps={2}
                onHandlerStateChange={doubleTapGestureHandler}
                ref={doubleTap}
                simultaneousHandlers={[pinch, pan, doubleTap]}
              >
                <Container style={[containerStyle]}>
                  <PinchGestureHandler
                    enabled={!disableAnimations && isZoomed}
                    onGestureEvent={pinchGestureHandler}
                    ref={pinch}
                    simultaneousHandlers={[pan, doubleTap, singleTap]}
                  >
                    <ImageWrapper style={[borderStyle, animatedStyle]}>
                      {children}
                    </ImageWrapper>
                  </PinchGestureHandler>
                </Container>
              </TapGestureHandler>
            </Animated.View>
          </TapGestureHandler>
        </ZoomContainer>
      </PanGestureHandler>
    </ButtonPressAnimation>
  );
};

const size = Math.ceil(CardSize) * PixelRatio.get();

const getLowResUrl = url => {
  if (url?.startsWith?.(GOOGLE_USER_CONTENT_URL)) {
    return `${url}=w${size}`;
  }
  return url;
};

const UniqueTokenExpandedStateContent = ({
  animationProgress,
  asset,
  borderRadius,
  horizontalPadding = 24,
  resizeMode = 'cover',
  disablePreview,
  sheetRef,
}) => {
  const { width: deviceWidth } = useDimensions();

  const maxImageWidth = deviceWidth - horizontalPadding * 2;
  const isENS =
    toLower(asset.asset_contract.address) === toLower(ENS_NFT_CONTRACT_ADDRESS);
  const isSVG = isSupportedUriExtension(asset.image_url, ['.svg']);
  const imageUrl = isSVG
    ? asset.image_preview_url
    : asset.image_url ||
      asset.image_original_url ||
      asset.image_preview_url ||
      asset.image_thumbnail_url;
  const size = deviceWidth * pixelRatio;
  const url = useMemo(() => {
    if (asset.image_url?.startsWith?.(GOOGLE_USER_CONTENT_URL) && size > 0) {
      return `${asset.image_url}=w${size}`;
    }
    return asset.image_url;
  }, [asset.image_url, size]);

  const aspectRatio = usePersistentAspectRatio(asset.image_url);
  const aspectRatioWithFallback = aspectRatio.result || 1;

  const lowResUrl = getLowResUrl(asset.image_url);
  const { supports3d, supportsVideo, supportsAudio } = useUniqueToken(asset);

  // When rendering a 3D/Video assets, we'll default to rendering a loading icon.
  const [loading, setLoading] = React.useState(supports3d || supportsVideo);

  return (
    <ZoomableWrapper
      animationProgress={animationProgress}
      aspectRatio={aspectRatioWithFallback}
      borderRadius={borderRadius}
      disableAnimations={disablePreview}
      horizontalPadding={horizontalPadding}
      isENS={isENS}
      onZoomIn={sheetRef.current?.scrollTo}
    >
      <View style={StyleSheet.absoluteFill}>
        {supportsVideo ? (
          <SimpleVideo
            loading={loading}
            posterUri={imageUrl}
            setLoading={setLoading}
            style={StyleSheet.absoluteFill}
            uri={asset.animation_url || imageUrl}
          />
        ) : supports3d ? (
          <ModelView
            fallbackUri={imageUrl}
            loading={loading}
            setLoading={setLoading}
            uri={asset.animation_url || imageUrl}
          />
        ) : supportsAudio ? (
          <AudioPlayer uri={asset.animation_url || imageUrl} />
        ) : (
          <UniqueTokenImage
            backgroundColor={asset.background}
            imageUrl={url}
            item={asset}
            lowResUrl={lowResUrl}
            resizeMode={resizeMode}
            size={maxImageWidth}
          />
        )}
        {!!loading && (
          <LoadingWrapper>
            <ActivityIndicator />
          </LoadingWrapper>
        )}
      </View>
    </ZoomableWrapper>
  );
};

export default magicMemo(UniqueTokenExpandedStateContent, 'asset.uniqueId');
