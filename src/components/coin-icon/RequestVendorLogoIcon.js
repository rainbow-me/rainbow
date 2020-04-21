import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import FastImage from 'react-native-fast-image';
import ShadowStack from 'react-native-shadow-stack';
import { colors, position } from '../../styles';
import { initials } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinIconSize } from './CoinIcon';

const RVLIBorderRadius = 16.25;
const RVLIShadows = {
  default: [
    [0, 4, 6, colors.dark, 0.04],
    [0, 1, 3, colors.dark, 0.08],
  ],
  large: [
    [0, 8, 11, colors.dark, 0.04],
    [0, 2, 6, colors.dark, 0.08],
  ],
};

const RequestVendorLogoIcon = ({
  backgroundColor,
  borderRadius,
  dappName,
  imageUrl,
  shouldPrioritizeImageLoading,
  showLargeShadow,
  size,
  ...props
}) => {
  const [error, setError] = useState(null);

  const imageSource = useMemo(
    () => ({
      priority:
        FastImage.priority[shouldPrioritizeImageLoading ? 'high' : 'low'],
      uri: imageUrl,
    }),
    [imageUrl, shouldPrioritizeImageLoading]
  );

  // When dapps have no icon the bg is transparent
  const bg = backgroundColor === 'transparent' ? colors.white : backgroundColor;

  return (
    <ShadowStack
      {...props}
      {...position.sizeAsObject(size)}
      backgroundColor={bg}
      borderRadius={borderRadius}
      shadows={RVLIShadows[showLargeShadow ? 'large' : 'default']}
    >
      <Centered {...position.sizeAsObject(size)} backgroundColor={bg}>
        {imageUrl && !error ? (
          <FastImage
            onError={err => setError(err)}
            source={imageSource}
            style={position.sizeAsObject('100%')}
          />
        ) : (
          <Text
            align="center"
            color={colors.getFallbackTextColor(bg)}
            size="smedium"
            weight="semibold"
          >
            {initials(dappName)}
          </Text>
        )}
      </Centered>
    </ShadowStack>
  );
};

RequestVendorLogoIcon.propTypes = {
  backgroundColor: PropTypes.string,
  borderRadius: PropTypes.number,
  dappName: PropTypes.string.isRequired,
  imageUrl: PropTypes.string,
  shouldPrioritizeImageLoading: PropTypes.bool,
  showLargeShadow: PropTypes.bool,
  size: PropTypes.number.isRequired,
};

RequestVendorLogoIcon.defaultProps = {
  backgroundColor: colors.dark,
  borderRadius: RVLIBorderRadius,
  size: CoinIconSize,
};

export default RequestVendorLogoIcon;
