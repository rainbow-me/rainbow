import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'react-native-blur-view';
import { buildUniqueTokenName } from '../../helpers/assets';
import { useTheme } from '../../theme/ThemeContext';
import { Centered } from '../layout';
import RemoteSvg from '../svg/RemoteSvg';
import { useColorMode, Text } from '@/design-system';
import svgToPngIfNeeded from '@/handlers/svgs';
import { useHiddenTokens } from '@/hooks';
import { Colors } from '@/styles';
import { AssetType } from '@/entities';
import { isLowerCaseMatch } from '@/utils';
import { RainbowImage } from '../RainbowImage';

function getFallbackTextColor(bg: string, isDarkMode: boolean, colors: Colors) {
  const variants = {
    dark: isDarkMode ? colors.alpha(colors.white, 0.25) : colors.alpha(colors.blueGreyDark, 0.5),
    light: isDarkMode ? colors.alpha(colors.blueGreyDark, 0.25) : colors.white,
  };
  return colors.getTextColorForBackground(bg, variants);
}

type UniqueTokenImageProps = {
  backgroundColor: string;
  imageUrl: string | null | undefined;
  id: string;
  collectionName: string;
  name: string;
  type: AssetType;
  uniqueId: string;
  lowResImageUrl?: string | null | undefined;
  mimeType: string | null | undefined;
  isCard?: boolean;
  transformSvgs?: boolean;
};

export const UniqueTokenName = React.memo(function UniqueTokenName({
  backgroundColor,
  isDarkMode,
  colors,
  collectionName,
  tokenId,
  name,
  uniqueId,
}: {
  backgroundColor: string;
  isDarkMode: boolean;
  colors: Colors;
  collectionName: string;
  tokenId: string;
  name: string;
  uniqueId: string;
}) {
  return (
    <Text color={{ custom: getFallbackTextColor(backgroundColor, isDarkMode, colors) }} size="15pt" align="center" containsEmoji>
      {buildUniqueTokenName({
        collectionName,
        tokenId,
        name,
        uniqueId,
      })}
    </Text>
  );
});

export const UniqueTokenImage = React.memo(function UniqueTokenImage({
  backgroundColor,
  imageUrl,
  lowResImageUrl,
  collectionName,
  name,
  type,
  uniqueId,
  id,
  isCard = false,
  mimeType,
  transformSvgs = true,
}: UniqueTokenImageProps) {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const { hiddenTokens } = useHiddenTokens();

  const [errorLoadingImage, setErrorLoadingImage] = useState(false);

  const onError = useCallback(() => setErrorLoadingImage(true), [setErrorLoadingImage]);

  const isHiddenToken = useMemo(() => {
    return hiddenTokens.find(token => isLowerCaseMatch(token, uniqueId));
  }, [hiddenTokens, uniqueId]);

  const isENS = type === AssetType.ens;
  const isSVG = mimeType === 'image/svg+xml';
  const hasImage = imageUrl !== null && imageUrl !== undefined;

  const shouldShowSvg = hasImage && isSVG && !errorLoadingImage && !transformSvgs;
  const shouldShowRegularImage = hasImage && !isSVG && !errorLoadingImage;
  const shouldShowTextFallback = (!shouldShowSvg && !shouldShowRegularImage) || (isHiddenToken && isCard);

  return (
    <Centered backgroundColor={backgroundColor} style={StyleSheet.absoluteFill}>
      {shouldShowSvg && (
        <RemoteSvg
          fallbackIfNonAnimated={!isENS || isCard}
          fallbackUri={svgToPngIfNeeded(imageUrl, true)}
          lowResFallbackUri={lowResImageUrl}
          onError={onError}
          style={StyleSheet.absoluteFill}
          uri={imageUrl}
        />
      )}
      {shouldShowRegularImage && <RainbowImage onError={onError} source={{ url: imageUrl }} style={StyleSheet.absoluteFillObject} />}
      {isHiddenToken && isCard && <BlurView blurIntensity={40} blurStyle={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
      {shouldShowTextFallback && (
        <UniqueTokenName
          backgroundColor={backgroundColor}
          isDarkMode={isDarkMode}
          colors={colors}
          collectionName={collectionName}
          tokenId={id}
          name={name}
          uniqueId={uniqueId}
        />
      )}
    </Centered>
  );
});

export default UniqueTokenImage;
