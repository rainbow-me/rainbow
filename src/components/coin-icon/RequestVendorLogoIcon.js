import React, { useMemo, useState } from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import { initials } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinIconSize } from './CoinIcon';
import { colors, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const RVLIBorderRadius = 16.25;
const RVLIShadows = {
  default: [
    [0, 4, 6, colors.dark, 0.04],
    [0, 1, 3, colors.dark, 0.08],
  ],
  large: [[0, 6, 10, colors.dark, 0.14]],
};

const Content = styled(Centered)`
  ${({ size }) => position.size(size)};
  background-color: ${({ color }) => color};
`;

export default function RequestVendorLogoIcon({
  backgroundColor = colors.dark,
  borderRadius = RVLIBorderRadius,
  dappName,
  imageUrl,
  shouldPrioritizeImageLoading,
  showLargeShadow,
  size = CoinIconSize,
  ...props
}) {
  const [error, setError] = useState(null);

  // When dapps have no icon the bgColor provided to us is transparent.
  // Having a transparent background breaks our UI, so we instead show a background
  // color of white.
  const bgColor =
    backgroundColor === 'transparent' ? colors.white : backgroundColor;

  const imageSource = useMemo(
    () => ({
      priority:
        FastImage.priority[shouldPrioritizeImageLoading ? 'high' : 'low'],
      uri: imageUrl,
    }),
    [imageUrl, shouldPrioritizeImageLoading]
  );

  return (
    <ShadowStack
      {...props}
      {...position.sizeAsObject(size)}
      backgroundColor={bgColor}
      borderRadius={borderRadius}
      shadows={RVLIShadows[showLargeShadow ? 'large' : 'default']}
    >
      <Content color={bgColor} size={size}>
        {imageUrl && !error ? (
          <FastImage
            onError={setError}
            source={imageSource}
            style={position.sizeAsObject('100%')}
          />
        ) : (
          <Text
            align="center"
            color={colors.getFallbackTextColor(bgColor)}
            size="smedium"
            weight="semibold"
          >
            {initials(dappName)}
          </Text>
        )}
      </Content>
    </ShadowStack>
  );
}
