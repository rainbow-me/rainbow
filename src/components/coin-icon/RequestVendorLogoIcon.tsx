import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { initials } from '../../utils';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../coin-icon/ChainBadge' was resolved to '... Remove this comment to see the full error message
import ChainBadge from '../coin-icon/ChainBadge';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinIcon' was resolved to '/Users/nickby... Remove this comment to see the full error message
import { CoinIconSize } from './CoinIcon';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const RVLIBorderRadius = 16.25;
const RVLIShadows = (colors: any) => ({
  default: [[0, 4, 12, colors.shadow, 0.06]],
  large: [[0, 6, 10, colors.shadow, 0.14]],
  none: [[0, 0, 0, colors.transparent, 0]],
});

const Content = styled(Centered)`
  ${({ size }) => position.size(size)};
  background-color: ${({ color }) => color};
`;

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
}: any) {
  const [error, setError] = useState(null);
  const { colors } = useTheme();

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

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ShadowStack
        {...props}
        {...position.sizeAsObject(size)}
        backgroundColor={colors.white}
        borderRadius={borderRadius}
        shadows={
          RVLIShadows(colors)[
            noShadow ? 'none' : showLargeShadow ? 'large' : 'default'
          ]
        }
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Content color={bgColor} size={size}>
          {imageUrl && !error ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ImgixImage
              onError={setError}
              source={imageSource}
              style={position.sizeAsObject('100%')}
            />
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ChainBadge assetType={network} badgeYPosition={badgeYPosition} />
    </View>
  );
}
