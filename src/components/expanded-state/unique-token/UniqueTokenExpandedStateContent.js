import { toLower } from 'lodash';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, PixelRatio, StyleSheet, View } from 'react-native';
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
      ((deviceHeight - containerHeightValue.value) / 2) *
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
      scale.value = withSpring(1, exitConfig);
      targetScale = 1;
    }

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
      translateY.value + (event?.velocityY ?? 0) >
      THRESHOLD * targetScale * targetScale
    ) {
      isZoomedValue.value = false;
      runOnJS(setIsZoomed)(false);
      scale.value = 1;
      animationProgress.value = withSpring(0, exitConfig);
      translateX.value = withSpring(0, exitConfig);
      translateY.value = withSpring(0, exitConfig);
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
    onStart: (_, ctx) => {
      ctx.start = scale.value;
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

  return (
    <ButtonPressAnimation
      onPress={() => {
        scale.value = 1;
        if (isZoomed) {
          isZoomedValue.value = false;
          setIsZoomed(false);
          animationProgress.value = withSpring(0, exitConfig);
        } else {
          isZoomedValue.value = true;
          setIsZoomed(true);
          animationProgress.value = withSpring(1, enterConfig);
        }
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
        <Container style={[containerStyle]}>
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
        </Container>
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

const UniqueTokenExpandedStateImage = ({
  asset,
  borderRadius,
  horizontalPadding = 24,
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
