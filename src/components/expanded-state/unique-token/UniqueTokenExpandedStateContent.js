import { toLower } from 'lodash';
import React, { useMemo } from 'react';
import { ActivityIndicator, PixelRatio, StyleSheet, View } from 'react-native';
import { ENS_NFT_CONTRACT_ADDRESS } from '../../../references';
import { magicMemo } from '../../../utils';
import { SimpleModelView } from '../../3d';
import { AudioPlayer } from '../../audio';
import { UniqueTokenImage } from '../../unique-token';
import { SimpleVideo } from '../../video';
import { ZoomableWrapper } from './ZoomableWrapper';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import {
  useDimensions,
  usePersistentAspectRatio,
  useUniqueToken,
} from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const pixelRatio = PixelRatio.get();

const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const MAX_IMAGE_SCALE = 4;

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
  yPosition,
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
      return `${asset.image_url}=w${size * MAX_IMAGE_SCALE}`;
    }
    if (asset.isPoap) return asset.animation_url;
    return asset.image_url;
  }, [asset.animation_url, asset.image_url, asset.isPoap, size]);

  const { supports3d, supportsVideo, supportsAudio } = useUniqueToken(asset);

  const supportsAnythingExceptImageAnd3d = supportsVideo || supportsAudio;

  const aspectRatio = usePersistentAspectRatio(asset.image_url);
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
      isENS={isENS}
      yDisplacement={yPosition}
    >
      <View style={StyleSheet.absoluteFill}>
        {supportsVideo ? (
          <SimpleVideo
            loading={loading}
            posterUri={imageUrl}
            setLoading={setLoading}
            size={maxImageWidth}
            style={StyleSheet.absoluteFill}
            uri={asset.animation_url || imageUrl}
          />
        ) : supports3d ? (
          <ModelView
            fallbackUri={imageUrl}
            loading={loading}
            setLoading={setLoading}
            size={maxImageWidth}
            uri={asset.animation_url || imageUrl}
          />
        ) : supportsAudio ? (
          <AudioPlayer
            fontColor={textColor}
            imageColor={imageColor}
            uri={asset.animation_url || imageUrl}
          />
        ) : (
          <UniqueTokenImage
            backgroundColor={asset.background}
            imageUrl={isSVG ? asset.image_url : url}
            item={asset}
            resizeMode={resizeMode}
            size={maxImageWidth}
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
