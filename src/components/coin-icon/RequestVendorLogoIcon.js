import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { initials } from '../../utils';
import ChainBadge from '../coin-icon/ChainBadge';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinIconSize } from './CoinIcon';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { position } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';

const RVLIBorderRadius = 16.25;
const RVLIShadows = colors => ({
  default: [[0, 4, 12, colors.shadow, 0.06]],
  large: [[0, 6, 10, colors.shadow, 0.14]],
  none: [[0, 0, 0, colors.transparent, 0]],
});

const Content = styled(Centered)(({ size, color }) => ({
  ...position.sizeAsObject(size),
  backgroundColor: color,
}));

export default function RequestVendorLogoIcon({
  backgroundColor,
  badgeYPosition = 14,
  borderRadius = RVLIBorderRadius,
  dappName,
  imageUrl,
  noShadow,
  shouldPrioritizeImageLoading,
  showLargeShadow,
  size = CoinIconSize,
  network,
  ...props
}) {
  const [error, setError] = useState(null);
  const { colors } = useTheme();

  // When dapps have no icon the bgColor provided to us is transparent.
  // Having a transparent background breaks our UI, so we instead show a background
  // color of white.
  const bgColor = backgroundColor === 'transparent' ? colors.white : backgroundColor || colors.dark;

  const imageSource = useMemo(
    () => ({
      priority: ImgixImage.priority[shouldPrioritizeImageLoading ? 'high' : 'low'],
      uri: imageUrl,
    }),
    [imageUrl, shouldPrioritizeImageLoading]
  );

  return (
    <View>
      <ShadowStack
        {...props}
        {...position.sizeAsObject(size)}
        backgroundColor={colors.white}
        borderRadius={borderRadius}
        shadows={RVLIShadows(colors)[noShadow ? 'none' : showLargeShadow ? 'large' : 'default']}
      >
        <Content color={bgColor} size={size}>
          {imageUrl && !error ? (
            <ImgixImage onError={setError} source={imageSource} style={position.sizeAsObject('100%')} size={200} />
          ) : (
            <Text align="center" color={colors.getFallbackTextColor(bgColor)} size="smedium" weight="semibold">
              {initials(dappName)}
            </Text>
          )}
        </Content>
      </ShadowStack>
      <ChainBadge network={network} badgeYPosition={badgeYPosition} />
    </View>
  );
}
