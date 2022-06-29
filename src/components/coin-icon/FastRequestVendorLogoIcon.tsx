import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { initials } from '../../utils';
import ChainBadge from '../coin-icon/ChainBadge';
import { Text } from '../text';
import { CoinIconSize } from './CoinIcon';
import { ImgixImage } from '@rainbow-me/images';
import { position } from '@rainbow-me/styles';
import { ThemeContextProps, useTheme } from '@rainbow-me/theme';
import ShadowStack from 'react-native-shadow-stack';

const RVLIBorderRadius = 16.25;
const RVLIShadows = (colors: ThemeContextProps['colors']) => ({
  default: [[0, 4, 12, colors.shadow, 0.06]],
  large: [[0, 6, 10, colors.shadow, 0.14]],
  none: [[0, 0, 0, colors.transparent, 0]],
});

const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgix: {
    ...position.sizeAsObject('100%'),
  },
});

export default React.memo(function RequestVendorLogoIcon({
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
}: {
  backgroundColor?: string;
  badgeYPosition?: number;
  borderRadius?: number;
  dappName: string;
  imageUrl: string;
  noShadow?: boolean;
  shouldPrioritizeImageLoading?: boolean;
  showLargeShadow?: boolean;
  size?: number;
  network?: string;
}) {
  const [error, setError] = useState(false);
  const { colors } = useTheme();

  const onError = useCallback(() => setError(true), [setError]);

  // When dapps have no icon the bgColor provided to us is transparent.
  // Having a transparent background breaks our UI, so we instead show a background
  // color of white.
  const bgColor =
    backgroundColor === 'transparent'
      ? colors.white
      : backgroundColor || colors.dark;

  const imageSource = useMemo(
    () => ({
      priority:
        ImgixImage.priority[shouldPrioritizeImageLoading ? 'high' : 'low'],
      uri: imageUrl,
    }),
    [imageUrl, shouldPrioritizeImageLoading]
  );

  const dappInitials = useMemo(() => initials(dappName), [dappName]);

  let shadowStyle: keyof ReturnType<typeof RVLIShadows>;
  if (noShadow) {
    shadowStyle = 'none';
  } else if (showLargeShadow) {
    shadowStyle = 'large';
  } else {
    shadowStyle = 'default';
  }

  return (
    <View>
      {/* @ts-ignore ShadowStack is not in TS */}
      <ShadowStack
        {...position.sizeAsObject(size)}
        backgroundColor={colors.white}
        borderRadius={borderRadius}
        shadows={RVLIShadows(colors)[shadowStyle]}
      >
        <View
          style={[
            sx.container,
            {
              backgroundColor: bgColor,
              ...position.sizeAsObject(size),
            },
          ]}
        >
          {imageUrl && !error ? (
            <ImgixImage
              onError={onError}
              source={imageSource}
              style={sx.imgix}
            />
          ) : (
            <Text
              align="center"
              color={colors.getFallbackTextColor(bgColor)}
              size="smedium"
              weight="semibold"
            >
              {dappInitials}
            </Text>
          )}
        </View>
      </ShadowStack>
      <ChainBadge assetType={network} badgeYPosition={badgeYPosition} />
    </View>
  );
});
