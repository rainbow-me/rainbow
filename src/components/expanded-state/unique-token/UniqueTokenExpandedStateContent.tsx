import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { type DerivedValue, type SharedValue } from 'react-native-reanimated';

import type { UniqueAsset } from '@/entities/uniqueAssets';
import styled from '@/framework/ui/styled-thing';
import useAnimationType from '@/hooks/useAnimationType';
import usePersistentAspectRatio from '@/hooks/usePersistentAspectRatio';
import { position } from '@/styles';

import { SimpleModelView } from '../../3d';
import { UniqueTokenImage } from '../../unique-token';
import { SimpleVideo } from '../../video';
import { ZoomableWrapper } from './ZoomableWrapper';

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
  disablePreview?: boolean;
  opacity?: DerivedValue<number>;
  yPosition?: SharedValue<number>;
  onContentFocus: () => void;
  onContentBlur: () => void;
};

const UniqueTokenExpandedStateContent = React.memo(function UniqueTokenExpandedStateContent({
  animationProgress,
  asset,
  borderRadius,
  horizontalPadding = 24,
  imageColor,
  disablePreview,
  opacity,
  yPosition,
  onContentFocus,
  onContentBlur,
}: UniqueTokenExpandedStateContentProps) {
  const animationType = useAnimationType(asset);

  const aspectRatio = usePersistentAspectRatio(asset.images.lowResUrl);
  const aspectRatioWithFallback = animationType === '3d' ? 0.88 : aspectRatio.result || 1;

  return (
    <ZoomableWrapper
      animationProgress={animationProgress}
      aspectRatio={aspectRatioWithFallback}
      borderRadius={borderRadius}
      disableAnimations={disablePreview || animationType === 'video'}
      horizontalPadding={horizontalPadding}
      onZoomIn={onContentFocus}
      onZoomOut={onContentBlur}
      opacity={opacity}
      yDisplacement={yPosition}
    >
      <View style={StyleSheet.absoluteFill}>
        {animationType ? (
          <AnimatedTokenMedia
            key={`${animationType}:${asset.images.animatedUrl}`}
            animationType={animationType}
            fallbackUrl={asset.images.highResUrl || asset.images.lowResUrl || ''}
            uri={asset.images.animatedUrl || ''}
          />
        ) : (
          <UniqueTokenImage
            collectionName={asset.collectionName ?? ''}
            name={asset.name}
            backgroundColor={asset.backgroundColor || imageColor}
            imageUrl={asset.images.highResUrl}
            lowResImageUrl={asset.images.lowResUrl}
            uniqueId={asset.uniqueId}
            id={asset.uniqueId}
            optimisticImageLoading
          />
        )}
      </View>
    </ZoomableWrapper>
  );
});

function AnimatedTokenMedia({ animationType, fallbackUrl, uri }: { animationType: '3d' | 'video'; fallbackUrl: string; uri: string }) {
  const [loading, setLoading] = React.useState(true);

  return (
    <>
      {animationType === 'video' ? (
        <SimpleVideo loading={loading} posterUri={fallbackUrl} setLoading={setLoading} style={StyleSheet.absoluteFill} uri={uri} />
      ) : (
        <ModelView fallbackUri={fallbackUrl} loading={loading} setLoading={setLoading} uri={uri} />
      )}
      {loading && (
        <LoadingWrapper>
          <ActivityIndicator />
        </LoadingWrapper>
      )}
    </>
  );
}

export default UniqueTokenExpandedStateContent;
