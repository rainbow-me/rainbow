import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { magicMemo } from '../../../utils';
import { SimpleModelView } from '../../3d';
import { AudioPlayer } from '../../audio';
import { UniqueTokenImage } from '../../unique-token';
import { SimpleVideo } from '../../video';
import { ZoomableWrapper } from './ZoomableWrapper';
import { usePersistentAspectRatio, useUniqueToken } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const ModelView = styled(SimpleModelView)(position.sizeAsObject('100%'));

const LoadingWrapper = styled(View)({
  alignItems: 'flex-end',
  height: '100%',
  justifyContent: 'flex-end',
  paddingBottom: 10,
  paddingRight: 10,
  position: 'absolute',
});

const UniqueTokenExpandedStateContent = ({
  animationProgress,
  asset,
  borderRadius,
  horizontalPadding = 24,
  imageColor,
  resizeMode = 'cover',
  textColor,
  disablePreview,
  opacity,
  yPosition,
  onContentFocus,
  onContentBlur,
}) => {
  const url = useMemo(() => {
    if (asset.isPoap) return asset.animation_url;
    return asset.image_url;
  }, [asset.animation_url, asset.image_url, asset.isPoap]);

  const { supports3d, supportsVideo, supportsAudio } = useUniqueToken(asset);

  const supportsAnythingExceptImageAnd3d = supportsVideo || supportsAudio;

  const aspectRatio = usePersistentAspectRatio(asset.lowResUrl);
  const aspectRatioWithFallback =
    supports3d || supportsAudio ? 0.88 : aspectRatio.result || 1;

  // default to showing a loading spinner for 3D/video assets
  const [loading, setLoading] = React.useState(supports3d || supportsVideo);

  return (
    <ZoomableWrapper
      animationProgress={animationProgress}
      aspectRatio={aspectRatioWithFallback}
      borderRadius={borderRadius}
      disableAnimations={
        disablePreview ||
        (ios ? supportsVideo : supportsAnythingExceptImageAnd3d)
      }
      horizontalPadding={horizontalPadding}
      onZoomIn={onContentFocus}
      onZoomOut={onContentBlur}
      opacity={opacity}
      yDisplacement={yPosition}
    >
      <View style={StyleSheet.absoluteFill}>
        {supportsVideo ? (
          <SimpleVideo
            loading={loading}
            posterUri={url}
            setLoading={setLoading}
            style={StyleSheet.absoluteFill}
            uri={asset.animation_url || url}
          />
        ) : supports3d ? (
          <ModelView
            fallbackUri={url}
            loading={loading}
            setLoading={setLoading}
            uri={asset.animation_url || url}
          />
        ) : supportsAudio ? (
          <AudioPlayer
            fontColor={textColor}
            imageColor={imageColor}
            uri={asset.animation_url || url}
          />
        ) : (
          <UniqueTokenImage
            backgroundColor={asset.background}
            imageUrl={url}
            item={asset}
            resizeMode={resizeMode}
            transformSvgs={false}
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
