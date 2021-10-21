import { toLower } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PixelRatio,
  StyleSheet,
  View,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
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
import { SimpleVideo } from '../../video';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import { useDimensions, useUniqueToken } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const pixelRatio = PixelRatio.get();

const springConfig = {
  damping: 40,
  mass: 1.5,
  overshootClamping: true,
  stiffness: 600,
};

const ImageWrapper = styled(Animated.View)`
  ${position.size('100%')};
  overflow: hidden;
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

const THRESHOLD = 250;

const ZoomableWrapper = ({
  animationProgress,
  children,
  horizontalPadding,
  aspectRatio,
  isENS,
  borderRadius,
}) => {
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

  const containerWidthValue = useReactiveSharedValue(containerWidth);
  const containerHeightValue = useReactiveSharedValue(containerHeight);
  const yPosition = useSharedValue(0);

  const [isZoomed, setIsZoomed] = useState(false);
  const isZoomedValue = useSharedValue(false);

  const fullSizeHeight = Math.min(deviceHeight, deviceWidth / aspectRatio);
  const fullSizeWidth = Math.min(deviceWidth, deviceHeight * aspectRatio);

  const containerStyle = useAnimatedStyle(() => ({
    height:
      containerHeightValue.value +
      animationProgress.value * (fullSizeHeight - containerHeightValue.value),
    marginBottom:
      (deviceHeight - (fullSizeHeight - containerHeightValue.value)) *
      animationProgress.value,
    marginTop:
      yPosition.value +
      animationProgress.value * ((deviceHeight - fullSizeHeight) / 2 - 85),
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

  const endGesture = useWorkletCallback(event => {
    'worklet';
    let targetScale = scale.value;
    if (scale.value < 1) {
      scale.value = withSpring(1, springConfig);
      targetScale = 1;
    }

    if (scale.value > 3) {
      scale.value = withSpring(3, springConfig);
      targetScale = 3;
    }

    const breakingScaleX = deviceWidth / fullSizeWidth;
    const breakingScaleY = deviceHeight / fullSizeHeight;

    if (targetScale > breakingScaleX) {
      const maxDisplacementX =
        (deviceWidth * (targetScale / breakingScaleX - 1)) / 2;
      if (translateX.value > maxDisplacementX) {
        translateX.value = withSpring(maxDisplacementX, springConfig);
      }
      if (translateX.value < -maxDisplacementX) {
        translateX.value = withSpring(-maxDisplacementX, springConfig);
      }
    } else {
      translateX.value = withSpring(0);
    }

    if (targetScale > breakingScaleY) {
      const maxDisplacementY =
        (deviceHeight * (targetScale / breakingScaleY - 1)) / 2;
      if (translateY.value > maxDisplacementY) {
        translateY.value = withSpring(maxDisplacementY, springConfig);
      }
      if (translateY.value < -maxDisplacementY) {
        translateY.value = withSpring(-maxDisplacementY, springConfig);
      }
    } else {
      translateY.value = withSpring(0);
    }

    if (
      translateY.value + (event?.velocityY ?? 0) >
      THRESHOLD * targetScale * targetScale
    ) {
      isZoomedValue.value = false;
      runOnJS(setIsZoomed)(false);
      scale.value = 1;
      animationProgress.value = withSpring(0, springConfig);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    }
  });

  const panGestureHandler = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onCancel: endGesture,
    onEnd: endGesture,
    onFail: endGesture,
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
  });

  const pinchGestureHandler = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      scale.value = ctx.start * event.scale;
    },
    // onEnd: () => {
    //   // translateX.value = withSpring(0);
    //   // translateY.value = withSpring(0);
    //   // if (event.translationY + event.velocityY > THRESHOLD) {
    //   //   isZoomedValue.value = false;
    //   //   runOnJS(setIsZoomed)(false);
    //   //   animationProgress.value = withSpring(0, springConfig);
    //   // }
    // },
    // onStart: (_, ctx) => {
    //   ctx.start = scale.value;
    // },
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

  return (
    <ButtonPressAnimation
      onPress={() => {
        scale.value = 1;
        isZoomedValue.value = !isZoomed;
        setIsZoomed(!isZoomed);
        translateX.value = withSpring(0);
        animationProgress.value = withSpring(
          isZoomedValue.value ? 1 : 0,
          springConfig
        );
      }}
      scaleTo={1}
      style={{ alignItems: 'center' }}
    >
      <PanGestureHandler
        enabled={isZoomed}
        onGestureEvent={panGestureHandler}
        ref={pan}
        simultaneousHandlers={[pinch]}
      >
        <Animated.View style={[containerStyle]}>
          <PinchGestureHandler
            enabled={isZoomed}
            onGestureEvent={pinchGestureHandler}
            ref={pinch}
            simultaneousHandlers={[pan]}
          >
            <ImageWrapper style={[borderStyle, animatedStyle]}>
              {children}
            </ImageWrapper>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </ButtonPressAnimation>
  );
};

const UniqueTokenExpandedStateImage = ({
  aspectRatio,
  asset,
  borderRadius,
  horizontalPadding = 24,
  lowResUrl,
  resizeMode = 'cover',
}) => {
  const { width: deviceWidth } = useDimensions();
  const animationProgress = useSharedValue(0);

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
  const size = Math.ceil((deviceWidth - horizontalPadding * 2) * pixelRatio);
  const url = useMemo(() => {
    if (asset.image_url?.startsWith?.(GOOGLE_USER_CONTENT_URL) && size > 0) {
      return `${asset.image_url}=w${size}`;
    }
    return asset.image_url;
  }, [asset.image_url, size]);

  const [fallbackAspectRatio, setFallbackAspectRatio] = useState(null);

  const aspectRatioWithFallback = aspectRatio || fallbackAspectRatio || 1;

  useEffect(() => {
    Image.getSize(lowResUrl, (width, height) => {
      setTimeout(() => setFallbackAspectRatio(width / height), 5000);
    });
  }, [lowResUrl]);

  const { supports3d, supportsVideo, supportsAudio } = useUniqueToken(asset);

  // When rendering a 3D/Video assets, we'll default to rendering a loading icon.
  const [loading, setLoading] = React.useState(supports3d || supportsVideo);

  return (
    <ZoomableWrapper
      animationProgress={animationProgress}
      aspectRatio={aspectRatioWithFallback}
      borderRadius={borderRadius}
      horizontalPadding={horizontalPadding}
      isENS={isENS}
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

export default magicMemo(UniqueTokenExpandedStateImage, 'asset.uniqueId');
