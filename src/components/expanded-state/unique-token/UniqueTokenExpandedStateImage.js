import React from 'react';
import styled from 'styled-components';
import { useDimensions, useImageMetadata } from '../../../hooks';
import useUniqueToken from '../../../hooks/useUniqueToken';
import { magicMemo } from '../../../utils';
import { SimpleModelView } from '../../3d';
import { Centered } from '../../layout';
import { UniqueTokenImage } from '../../unique-token';
import { margin, padding, position } from '@rainbow-me/styles';

const paddingHorizontal = 19;

const Container = styled(Centered)`
  ${padding(0, paddingHorizontal)};
  height: ${({ height }) => height};
  ${android ? `margin-bottom: 10;` : ``}
`;

const ImageWrapper = styled(Centered)`
  ${({ isImageHuge }) => margin(isImageHuge ? paddingHorizontal : 0, 0)};
  ${position.size('100%')};
  border-radius: 10;
  overflow: hidden;
`;

const ModelView = styled(SimpleModelView)`
  ${position.size('100%')};
`;

const UniqueTokenExpandedStateImage = ({ asset }) => {
  const { width: deviceWidth } = useDimensions();

  const imageUrl = asset.image_preview_url;
  const { dimensions: imageDimensions } = useImageMetadata(imageUrl);

  const maxImageWidth = deviceWidth - paddingHorizontal * 2;
  const maxImageHeight = maxImageWidth * 1.5;

  const heightForDeviceSize =
    (maxImageWidth * imageDimensions.height) / imageDimensions.width;

  const containerHeight =
    heightForDeviceSize > maxImageHeight ? maxImageWidth : heightForDeviceSize;

  const { supports3d } = useUniqueToken(asset);
  return (
    <Container height={containerHeight}>
      <ImageWrapper isImageHuge={heightForDeviceSize > maxImageHeight}>
        {supports3d ? (
          <ModelView fallbackUri={imageUrl} uri={asset.animation_url} />
        ) : (
          <UniqueTokenImage
            backgroundColor={asset.background}
            imageUrl={imageUrl}
            item={asset}
            resizeMode="contain"
          />
        )}
      </ImageWrapper>
    </Container>
  );
};

export default magicMemo(UniqueTokenExpandedStateImage, 'asset.uniqueId');
