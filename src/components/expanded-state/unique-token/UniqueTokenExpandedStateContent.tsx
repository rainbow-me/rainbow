import React from 'react';
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
import { UniqueAsset } from '@/entities';
import { DerivedValue, SharedValue } from 'react-native-reanimated';

const ModelView = styled(SimpleModelView)(position.sizeAsObject('100%'));

const LoadingWrapper = styled(View)({
  alignItems: 'flex-end',
  height: '100%',
  justifyContent: 'flex-end',
  paddingBottom: 10,
  paddingRight: 10,
  position: 'absolute',
});

type UniqueTokenExpandedStateContentProps = {
  animationProgress?: SharedValue<number>;
  asset: UniqueAsset;
  borderRadius?: number;
  horizontalPadding?: number;
  imageColor: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat';
  textColor?: string;
  disablePreview?: boolean;
  opacity?: DerivedValue<number>;
  yPosition?: SharedValue<number>;
  onContentFocus: () => void;
  onContentBlur: () => void;
};

const UniqueTokenExpandedStateContent = ({
  animationProgress,
  asset,
  borderRadius,
  horizontalPadding = 24,
  imageColor,
  textColor,
  disablePreview,
  opacity,
  yPosition,
  onContentFocus,
  onContentBlur,
}: UniqueTokenExpandedStateContentProps) => {
  const { supports3d, supportsVideo, supportsAudio } = useUniqueToken(asset);

  const supportsAnythingExceptImageAnd3d = supportsVideo || supportsAudio;

  const aspectRatio = usePersistentAspectRatio(asset.images.lowResUrl);
  const aspectRatioWithFallback = supports3d || supportsAudio ? 0.88 : aspectRatio.result || 1;

  // default to showing a loading spinner for 3D/video assets
  const [loading, setLoading] = React.useState(supports3d || supportsVideo);

  const fallbackUrl = asset.images.highResUrl || asset.images.lowResUrl || '';

  return (
    <ZoomableWrapper
      // @ts-expect-error animationProgress is optional... but javascript component
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
            posterUri={fallbackUrl}
            setLoading={setLoading}
            style={StyleSheet.absoluteFill}
            uri={asset.images.animatedUrl || ''}
          />
        ) : supports3d ? (
          <ModelView fallbackUri={fallbackUrl} loading={loading} setLoading={setLoading} uri={asset.images.animatedUrl || ''} />
        ) : supportsAudio ? (
          <AudioPlayer fontColor={textColor} imageColor={imageColor} uri={fallbackUrl} />
        ) : (
          <UniqueTokenImage
            collectionName={asset.collectionName ?? ''}
            name={asset.name}
            backgroundColor={asset.backgroundColor || imageColor}
            imageUrl={asset.images.highResUrl}
            lowResImageUrl={asset.images.lowResUrl}
            mimeType={asset.images.mimeType}
            uniqueId={asset.uniqueId}
            id={asset.uniqueId}
            type={asset.type}
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
