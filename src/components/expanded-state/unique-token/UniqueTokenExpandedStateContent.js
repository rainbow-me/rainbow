import { toLower } from 'lodash';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PixelRatio,
  StyleSheet,
  View,
} from 'react-native';
import styled from 'styled-components';
import { ENS_NFT_CONTRACT_ADDRESS } from '../../../references';
import { magicMemo } from '../../../utils';
import { SimpleModelView } from '../../3d';
import { AudioPlayer } from '../../audio';
import { Centered } from '../../layout';
import { UniqueTokenImage } from '../../unique-token';
import { SimpleVideo } from '../../video';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import { useDimensions, useUniqueToken } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';

export const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const pixelRatio = PixelRatio.get();

const Container = styled(Centered)`
  align-self: center;
  height: ${({ height }) => height};
  ${android ? `margin-bottom: 10;` : ``}
  shadow-color: ${({ theme: { colors } }) => colors.shadowBlack};
  shadow-offset: 0 20px;
  shadow-opacity: 0.4;
  shadow-radius: 30px;
  width: ${({ width }) => width};
`;

const ImageWrapper = styled(Centered)`
  ${position.size('100%')};
  border-radius: ${({ borderRadius }) => borderRadius || 16};
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

const UniqueTokenExpandedStateImage = ({
  aspectRatio,
  asset,
  borderRadius,
  horizontalPadding = 24,
  lowResUrl,
  resizeMode = 'cover',
}) => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();

  const maxImageWidth = deviceWidth - horizontalPadding * 2;
  const maxImageHeight = deviceHeight / 2;

  const [containerWidth, setContainerWidth] = useState(maxImageWidth);
  const [containerHeight, setContainerHeight] = useState(maxImageWidth);
  const [fallbackAspectRatio, setFallbackAspectRatio] = useState(null);

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

  const aspectRatioWithFallback = aspectRatio || fallbackAspectRatio || 1;

  useEffect(() => {
    Image.getSize(lowResUrl, (width, height) => {
      setFallbackAspectRatio(width / height);
    });
  }, [lowResUrl]);

  useEffect(() => {
    const isSquare = aspectRatioWithFallback === 1 || isENS;
    const isLandscape = aspectRatioWithFallback > 1;
    const isPortrait = aspectRatioWithFallback < 1;

    if (isSquare) {
      setContainerHeight(maxImageWidth);
      setContainerWidth(maxImageWidth);
    }

    if (isLandscape) {
      setContainerHeight(maxImageWidth / aspectRatioWithFallback);
      setContainerWidth(maxImageWidth);
    }

    if (isPortrait) {
      if (maxImageWidth / aspectRatioWithFallback > maxImageHeight) {
        setContainerHeight(maxImageHeight);
        setContainerWidth(aspectRatioWithFallback * maxImageHeight);
      } else {
        setContainerHeight(maxImageWidth / aspectRatioWithFallback);
        setContainerWidth(maxImageWidth);
      }
    }
  }, [aspectRatioWithFallback, isENS, maxImageHeight, maxImageWidth]);

  const { supports3d, supportsVideo, supportsAudio } = useUniqueToken(asset);

  // When rendering a 3D/Video assets, we'll default to rendering a loading icon.
  const [loading, setLoading] = React.useState(supports3d || supportsVideo);

  return (
    <>
      <Container
        height={containerHeight}
        maxWidth={maxImageWidth}
        width={containerWidth}
      >
        <ImageWrapper borderRadius={borderRadius}>
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
                shouldRasterizeIOS
                size={maxImageWidth}
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
    </>
  );
};

export default magicMemo(UniqueTokenExpandedStateImage, 'asset.uniqueId');
