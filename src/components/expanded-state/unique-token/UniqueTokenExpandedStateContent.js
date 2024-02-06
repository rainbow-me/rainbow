import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { magicMemo } from '../../../utils';
import { SimpleModelView } from '../../3d';
import { AudioPlayer } from '../../audio';
import { UniqueTokenImage } from '../../unique-token';
import { SimpleVideo } from '../../video';
import { ZoomableWrapper } from './ZoomableWrapper';
import { usePersistentAspectRatio, useUniqueToken } from '@/hooks';
import styled from '@/styled-thing';
import { position } from '@/styles';

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
  const { supports3d, supportsVideo, supportsAudio } = useUniqueToken(asset);

  const supportsAnythingExceptImageAnd3d = supportsVideo || supportsAudio;

  const aspectRatio = usePersistentAspectRatio(asset.lowResUrl);
  const aspectRatioWithFallback = supports3d || supportsAudio ? 0.88 : aspectRatio.result || 1;

  // default to showing a loading spinner for 3D/video assets
  const [loading, setLoading] = React.useState(supports3d || supportsVideo);

  return (
    <ZoomableWrapper
      animationProgress={animationProgress}
      aspectRatio={aspectRatioWithFallback}
      borderRadius={borderRadius}
      disableAnimations={disablePreview || (ios ? supportsVideo : supportsAnythingExceptImageAnd3d)}
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
            posterUri={asset.image_url}
            setLoading={setLoading}
            style={StyleSheet.absoluteFill}
            uri={asset.animation_url || asset.image_url}
          />
        ) : supports3d ? (
          <ModelView fallbackUri={asset.image_url} loading={loading} setLoading={setLoading} uri={asset.animation_url || asset.image_url} />
        ) : supportsAudio ? (
          <AudioPlayer fontColor={textColor} imageColor={imageColor} uri={asset.animation_url || asset.image_url} />
        ) : (
          <UniqueTokenImage
            backgroundColor={asset.background}
            imageUrl={asset.image_url}
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

export default magicMemo(UniqueTokenExpandedStateContent, 'uniqueId');
