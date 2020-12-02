import React from 'react';
import styled from 'styled-components/primitives';
import { useDimensions, useImageMetadata } from '../../../hooks';
import { magicMemo } from '../../../utils';
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

  return (
    <Container height={containerHeight}>
      <ImageWrapper isImageHuge={heightForDeviceSize > maxImageHeight}>
        <UniqueTokenImage
          backgroundColor={asset.background}
          imageUrl={imageUrl}
          item={asset}
          resizeMode="contain"
        />
      </ImageWrapper>
    </Container>
  );
};

export default magicMemo(UniqueTokenExpandedStateImage, 'asset.uniqueId');
