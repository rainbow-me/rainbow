import withViewLayoutProps from '@hocs/with-view-layout-props';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withProps } from 'recompact';
import { withImageDimensionsCache } from '../../hoc';
import { colors } from '../../styles';
import { deviceUtils } from '../../utils';
import { Column } from '../layout';
import { UniqueTokenCard } from '../unique-token';

const enhance = compose(
  withImageDimensionsCache,
  withViewLayoutProps(
    ({ width: containerWidth, height: containerHeight, y }) => ({
      containerHeight: containerHeight - y * 2,
      containerWidth,
    })
  ),
  withProps(({ image_preview_url, imageDimensionsCache }) => ({
    imageDimensions: imageDimensionsCache[image_preview_url],
  })),
  withProps(({ containerHeight, imageDimensions }) => {
    if (!imageDimensions) {
      imageDimensions = { height: 512, width: 512 };
    }
    let width = deviceUtils.dimensions.width - 30;
    let height = !imageDimensions
      ? width
      : (width * imageDimensions.height) / imageDimensions.width;

    if (height > containerHeight) {
      height = containerHeight;
      width = (height * imageDimensions.width) / imageDimensions.height;
    }

    return {
      height,
      width,
    };
  }),
  onlyUpdateForKeys(['containerHeight', 'containerWidth', 'height', 'width'])
);

const SendAssetFormCollectible = enhance(
  ({ containerHeight, containerWidth, height, onLayout, width, ...props }) => (
    <Column align="center" flex={1} onLayout={onLayout} width="100%">
      {!!containerHeight && !!containerWidth && (
        <UniqueTokenCard
          {...props}
          borderEnabled={false}
          disabled
          height={height}
          item={props}
          resizeMode="contain"
          shadowStyle={{
            shadowColor: colors.dark,
            shadowOffset: { height: 10, width: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 25,
          }}
          width={width}
        />
      )}
    </Column>
  )
);

SendAssetFormCollectible.propTypes = {
  containerHeight: PropTypes.number,
  containerWidth: PropTypes.number,
  height: PropTypes.number,
  onLayout: PropTypes.func,
  width: PropTypes.number,
};

export default SendAssetFormCollectible;
