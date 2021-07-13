import React from 'react';
import { ActivityIndicator, PixelRatio, StyleSheet, View } from 'react-native';
import styled from 'styled-components';
import { magicMemo } from '../../../utils';
import { SimpleModelView } from '../../3d';
import { AudioPlayer } from '../../audio';
import { Centered } from '../../layout';
import { UniqueTokenImage } from '../../unique-token';
import { SimpleVideo } from '../../video';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import {
  useDimensions,
  useImageMetadata,
  useUniqueToken,
} from '@rainbow-me/hooks';
import { margin, padding, position } from '@rainbow-me/styles';

const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const pixelRatio = PixelRatio.get();

const Container = styled(Centered)`
  ${({ horizontalPadding }) => padding(0, horizontalPadding)};
  height: ${({ height }) => height};
  ${android ? `margin-bottom: 10;` : ``}
`;

const ImageWrapper = styled(Centered)`
  ${({ isImageHuge, horizontalPadding }) =>
    margin(isImageHuge ? horizontalPadding : 0, 0)};
  ${position.size('100%')};
  border-radius: ${({ borderRadius }) => borderRadius || 10};
  overflow: hidden;
`;

const ModelView = styled(SimpleModelView)`
  ${position.size('100%')};
`;

const LoadingWrapper = styled(View)`
  position: absolute;
  width: 100%;
  height: 100%;
  padding-bottom: 10;
  padding-right: 10;
  align-items: flex-end;
  justify-content: flex-end;
`;

const UniqueTokenExpandedStateImage = ({
  asset,
  borderRadius,
  height,
  horizontalPadding = 19,
  resizeMode = 'contain',
}) => {
  const { width: deviceWidth } = useDimensions();

  const isSVG = isSupportedUriExtension(asset.image_url, ['.svg']);
  const imageUrl = isSVG
    ? asset.image_preview_url
    : asset.image_url ||
      asset.image_original_url ||
      asset.image_preview_url ||
      asset.image_thumbnail_url;
  const { dimensions: imageDimensions } = useImageMetadata(imageUrl);
  const size = Math.ceil((deviceWidth * pixelRatio) / 100) * 100;
  const url = useMemo(() => {
    if (asset.image_url?.startsWith?.(GOOGLE_USER_CONTENT_URL) && size > 0) {
      return `${asset.image_url}=w${size}`;
    }
    return asset.image_url;
  }, [asset.image_url, size]);

  const lowResUrl = useMemo(() => {
    if (asset.image_url?.startsWith?.(GOOGLE_USER_CONTENT_URL) && size > 0) {
      return `${asset.image_url}=w${12}`;
    }
    return null;
  }, [asset.image_url, size]);

  const maxImageWidth = deviceWidth - horizontalPadding * 2;
  const maxImageHeight = maxImageWidth * 1.5;

  const heightForDeviceSize =
    (maxImageWidth * imageDimensions.height) / imageDimensions.width;

  const containerHeight =
    heightForDeviceSize > maxImageHeight ? maxImageWidth : heightForDeviceSize;

  const { supports3d, supportsVideo, supportsAudio } = useUniqueToken(asset);

  // When rendering a 3D/Video assets, we'll default to rendering a loading icon.
  const [loading, setLoading] = React.useState(supports3d || supportsVideo);

  return (
    <Container
      height={height || containerHeight}
      horizontalPadding={horizontalPadding}
    >
      <ImageWrapper
        borderRadius={borderRadius}
        horizontalPadding={horizontalPadding}
        isImageHuge={heightForDeviceSize > maxImageHeight}
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
            />
          )}
          {!!loading && (
            <LoadingWrapper>
              <ActivityIndicator />
            </LoadingWrapper>
          )}
        </View>
      </ImageWrapper>
    </Container>
  );
};

export default magicMemo(UniqueTokenExpandedStateImage, 'asset.uniqueId');
