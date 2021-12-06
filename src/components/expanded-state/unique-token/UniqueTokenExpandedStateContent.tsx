import { toLower } from 'lodash';
import React, { useMemo } from 'react';
import { ActivityIndicator, PixelRatio, StyleSheet, View } from 'react-native';
import styled from 'styled-components';
import { ENS_NFT_CONTRACT_ADDRESS } from '../../../references';
import { magicMemo } from '../../../utils';
import { getLowResUrl } from '../../../utils/getLowResUrl';
import { SimpleModelView } from '../../3d';
import { AudioPlayer } from '../../audio';
import { UniqueTokenImage } from '../../unique-token';
import { SimpleVideo } from '../../video';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ZoomableWrapper' was resolved to '/Users... Remove this comment to see the full error message
import { ZoomableWrapper } from './ZoomableWrapper';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/isSupporte... Remove this comment to see the full error message
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import {
  useDimensions,
  usePersistentAspectRatio,
  useUniqueToken,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const pixelRatio = PixelRatio.get();

const GOOGLE_USER_CONTENT_URL = 'https://lh3.googleusercontent.com/';
const MAX_IMAGE_SCALE = 4;

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
}: any) => {
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
    return asset.image_url;
  }, [asset.image_url, size]);

  const lowResUrl = isENS ? url : getLowResUrl(asset.image_url);
  const { supports3d, supportsVideo, supportsAudio } = useUniqueToken(asset);

  const supportsAnythingExceptImage =
    supports3d || supportsVideo || supportsAudio;
  const aspectRatio = usePersistentAspectRatio(asset.image_url);
  const aspectRatioWithFallback =
    supports3d || supportsAudio ? 0.88 : aspectRatio.result || 1;

  // default to showing a loading spinner for 3D/video assets
  const [loading, setLoading] = React.useState(supports3d || supportsVideo);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ZoomableWrapper
      animationProgress={animationProgress}
      aspectRatio={aspectRatioWithFallback}
      borderRadius={borderRadius}
      disableAnimations={disablePreview || supportsAnythingExceptImage}
      horizontalPadding={horizontalPadding}
      isENS={isENS}
      yDisplacement={yPosition}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View style={StyleSheet.absoluteFill}>
        {supportsVideo ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <SimpleVideo
            loading={loading}
            posterUri={imageUrl}
            setLoading={setLoading}
            style={StyleSheet.absoluteFill}
            uri={asset.animation_url || imageUrl}
          />
        ) : supports3d ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ModelView
            fallbackUri={imageUrl}
            loading={loading}
            setLoading={setLoading}
            uri={asset.animation_url || imageUrl}
          />
        ) : supportsAudio ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <AudioPlayer
            fontColor={textColor}
            imageColor={imageColor}
            uri={asset.animation_url || imageUrl}
          />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <UniqueTokenImage
            backgroundColor={asset.background}
            imageUrl={isSVG ? asset.image_url : url}
            item={asset}
            lowResUrl={lowResUrl}
            resizeMode={resizeMode}
            size={maxImageWidth}
            transformSvgs={false}
          />
        )}
        {!!loading && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <LoadingWrapper>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ActivityIndicator />
          </LoadingWrapper>
        )}
      </View>
    </ZoomableWrapper>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(UniqueTokenExpandedStateContent, 'asset.uniqueId');
