import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { useDimensions } from '../../../hooks';
import { position } from '../../../styles';
import { magicMemo } from '../../../utils';
import { Centered } from '../../layout';
import { UniqueTokenImage } from '../../unique-token';

const paddingHorizontal = 19;

const UniqueTokenExpandedStateImage = ({ asset }) => {
  const { width } = useDimensions();

  const imageUrl = asset.image_preview_url; //.replace('s250', `s${width * scale}`);
  const imageDimensions = useSelector(
    ({ imageDimensionsCache }) => imageDimensionsCache[imageUrl]
  );

  const maxImageWidth = width - paddingHorizontal * 2;
  const maxImageHeight = maxImageWidth * 1.5;

  const heightForDeviceSize =
    (maxImageWidth * imageDimensions.height) / imageDimensions.width;

  const containerHeight =
    heightForDeviceSize > maxImageHeight ? maxImageWidth : heightForDeviceSize;

  return (
    <Centered height={containerHeight} paddingHorizontal={paddingHorizontal}>
      <Centered
        {...position.sizeAsObject('100%')}
        borderRadius={10}
        marginVertical={
          heightForDeviceSize > maxImageHeight ? paddingHorizontal : 0 // 👈️ make this work
        }
        overflow="hidden"
      >
        <UniqueTokenImage
          backgroundColor={asset.background}
          imageUrl={imageUrl}
          item={asset}
          resizeMode="contain"
        />
      </Centered>
    </Centered>
  );
};

UniqueTokenExpandedStateImage.propTypes = {
  asset: PropTypes.object,
};

export default UniqueTokenExpandedStateImage;//magicMemo(, 'asset');
