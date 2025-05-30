import React, { useCallback, useMemo, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { BlurView } from 'react-native-blur-view';
import { buildUniqueTokenName } from '../../helpers/assets';
import { useTheme } from '../../theme/ThemeContext';
import { Centered } from '../layout';
import RemoteSvg from '../svg/RemoteSvg';
import { Text as LegacyText } from '../text';
import { useColorMode } from '@/design-system';
import svgToPngIfNeeded from '@/handlers/svgs';
import { useHiddenTokens } from '@/hooks';
import { ENS_NFT_CONTRACT_ADDRESS } from '@/references';
import { Colors } from '@/styles';

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
  fullUniqueId: string;
  id: string;
  collectionName: string;
  name: string;
  uniqueId: string;
  lowResImageUrl?: string | null | undefined;
  address?: string | null;
  mimeType: string | null | undefined;
  isCard?: boolean;
  transformSvgs?: boolean;
};

export const UniqueTokenImage = React.memo(function UniqueTokenImage({
  backgroundColor: givenBackgroundColor,
  imageUrl,
  lowResImageUrl,
  collectionName,
  name,
  uniqueId,
  fullUniqueId,
  id,
  address,
  isCard = false,
  mimeType,
  transformSvgs = true,
}: UniqueTokenImageProps) {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const { hiddenTokens } = useHiddenTokens();

  const [errorLoadingImage, setErrorLoadingImage] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const onLoad = useCallback(() => setIsLoaded(true), [setIsLoaded]);
  const onError = useCallback(
    (e: any) => {
      console.log('onError', e);
      setErrorLoadingImage(true);
    },
    [setErrorLoadingImage]
  );

  const isHiddenToken = useMemo(() => {
    return hiddenTokens.find(token => token === fullUniqueId);
  }, [hiddenTokens, fullUniqueId]);

  const backgroundColor = givenBackgroundColor;
  const isENS = address?.toLowerCase() === ENS_NFT_CONTRACT_ADDRESS;
  const isSVG = mimeType === 'image/svg+xml';
  const hasImage = imageUrl !== null && imageUrl !== undefined;

  const shouldShowSvg = hasImage && isSVG && !errorLoadingImage && !transformSvgs;
  const shouldShowRegularImage = hasImage && !isSVG && !errorLoadingImage;
  const shouldShowTextFallback = (!shouldShowSvg && !shouldShowRegularImage) || (isHiddenToken && isCard);

  console.log('imageUrl', imageUrl);
  console.log('lowResImageUrl', lowResImageUrl);
  console.log(mimeType);
  console.log({
    shouldShowSvg,
    shouldShowRegularImage,
    shouldShowTextFallback,
  });

  return (
    <Centered backgroundColor={backgroundColor} style={StyleSheet.absoluteFill}>
      {shouldShowSvg && (
        <RemoteSvg
          fallbackIfNonAnimated={!isENS || isCard}
          fallbackUri={svgToPngIfNeeded(imageUrl, true)}
          lowResFallbackUri={imageUrl}
          onError={onError}
          style={StyleSheet.absoluteFill}
          uri={imageUrl}
        />
      )}
      {shouldShowRegularImage && (
        <>
          <Image onError={onError} onLoad={onLoad} source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} />
          {!isLoaded && lowResImageUrl && <Image source={{ uri: `lowResImageUrl` }} style={StyleSheet.absoluteFill} />}
        </>
      )}
      {isHiddenToken && isCard && <BlurView blurIntensity={40} blurStyle={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
      {shouldShowTextFallback && (
        <LegacyText align="center" color={getFallbackTextColor(backgroundColor, isDarkMode, colors)} lineHeight="looser" size="smedium">
          {buildUniqueTokenName({
            collection: { name: collectionName },
            id,
            name,
            uniqueId,
          })}
        </LegacyText>
      )}
    </Centered>
  );
});
