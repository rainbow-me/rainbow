import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'react-native-blur-view';
import { buildUniqueTokenName } from '../../helpers/assets';
import { useTheme } from '../../theme/ThemeContext';
import { Centered } from '../layout';
import { useColorMode, Text } from '@/design-system';
import { useHiddenTokens } from '@/hooks';
import { Colors } from '@/styles';
import { isLowerCaseMatch } from '@/utils';
import { RainbowImage } from '../RainbowImage';
import { logger } from '@/logger';

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
  uniqueId: string;
  lowResImageUrl?: string | null | undefined;
  isCard?: boolean;
  optimisticImageLoading?: boolean;
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
  uniqueId,
  id,
  isCard = false,
  optimisticImageLoading = false,
}: UniqueTokenImageProps) {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const { hiddenTokens } = useHiddenTokens();

  const [isLoading, setIsLoading] = useState(optimisticImageLoading);
  const [errorLoadingImage, setErrorLoadingImage] = useState(false);

  const onLoad = useCallback(() => setIsLoading(false), [setIsLoading]);
  const onError = useCallback(
    (...args: unknown[]) => {
      logger.warn(`[UniqueTokenImage] Error loading image: ${args} for ${uniqueId}`);
      setErrorLoadingImage(true);
    },
    [setErrorLoadingImage, uniqueId]
  );

  const isHiddenToken = useMemo(() => {
    return hiddenTokens.find(token => isLowerCaseMatch(token, uniqueId));
  }, [hiddenTokens, uniqueId]);

  const hasImage = imageUrl !== null && imageUrl !== undefined;
  const shouldShowRegularImage = hasImage && !errorLoadingImage;
  const shouldShowTextFallback = !shouldShowRegularImage || (isHiddenToken && isCard);

  return (
    <Centered backgroundColor={backgroundColor} style={StyleSheet.absoluteFill}>
      {shouldShowRegularImage && (
        <>
          <RainbowImage onError={onError} onSuccess={onLoad} source={{ url: imageUrl }} style={StyleSheet.absoluteFillObject} />
          {optimisticImageLoading && isLoading && lowResImageUrl && (
            <RainbowImage source={{ url: lowResImageUrl }} style={StyleSheet.absoluteFillObject} />
          )}
        </>
      )}
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
