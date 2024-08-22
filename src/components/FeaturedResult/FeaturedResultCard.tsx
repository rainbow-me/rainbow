import { FeaturedResultsVariables, useFeaturedResults } from '@/resources/featuredResults/getFeaturedResults';
import { GenericCard, Gradient } from '../cards/GenericCard';
import { getFeaturedResultById } from '@/resources/featuredResults/_selectors/getFeaturedResultById';
import { useTrackFeaturedResult } from '@/resources/featuredResults/trackFeaturedResult';
import { TrackFeaturedResultType } from '@/graphql/__generated__/arc';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Box, ColorModeProvider, Column, Columns, Stack, Text } from '@/design-system';
import { ImgixImage } from '../images';
import { FeaturedResultStackProps } from './FeaturedResultStack';
import { deviceUtils } from '@/utils';
import { StyleSheet } from 'react-native';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { logger } from '@/logger';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { getHighContrastColor, getMixedColor, getTextColor, getTintedBackgroundColor, opacity } from '@/__swaps__/utils/swaps';
import { useTheme } from '@/theme';
import { colors } from '@/styles';

const { width: SCREEN_WIDTH } = deviceUtils.dimensions;
const CARD_HORIZONTAL_PADDING = 40;
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2;
const IMAGE_ASPECT_RATIO = 16 / 9;
const IMAGE_WIDTH = CARD_WIDTH;
const IMAGE_HEIGHT = IMAGE_WIDTH / IMAGE_ASPECT_RATIO;

type FeaturedResultCardProps = FeaturedResultStackProps &
  FeaturedResultsVariables & {
    featuredResultId: string;
  };

export const FeaturedResultCard = ({ cardType, featuredResultId, ...props }: FeaturedResultCardProps) => {
  const { isDarkMode } = useTheme();
  const { data: featuredResult } = useFeaturedResults(props, {
    select: data => getFeaturedResultById(data, featuredResultId),
  });

  const { navigate } = useNavigation();

  const { mutateAsync: trackFeaturedResult } = useTrackFeaturedResult();

  const imageColor = usePersistentDominantColorFromImage(featuredResult?.imageUrl) ?? colors.avatarColor[colors.getRandomColor()];

  const bgColors = useMemo(() => getHighContrastColor(imageColor), [imageColor]);
  const tintedBgColors = useMemo(() => getTintedBackgroundColor(bgColors), [bgColors]);
  const textColors = useMemo(() => getTextColor(bgColors), [bgColors]);

  const bgColor = bgColors[isDarkMode ? 'dark' : 'light'];
  const tintedBgColor = tintedBgColors[isDarkMode ? 'dark' : 'light'];
  const textColor = textColors[isDarkMode ? 'dark' : 'light'];

  const buttonColor = getMixedColor(imageColor, bgColor, 1);
  const buttonTextColor = getTextColor({ light: buttonColor, dark: buttonColor })[isDarkMode ? 'dark' : 'light'];

  // Create a gradient based on the background color
  const gradient: Gradient = useMemo(
    () => ({
      colors: [bgColor, tintedBgColor],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    }),
    [bgColor, tintedBgColor]
  );

  useEffect(() => {
    if (!featuredResult) {
      return;
    }

    trackFeaturedResult({
      featuredResultCreativeId: featuredResult.advertiserId,
      placementId: featuredResult.placementSlug,
      impressionId: featuredResult.impressionId,
      type: TrackFeaturedResultType.Impression,
    });
  }, [featuredResult, trackFeaturedResult]);

  const handlePress = useCallback(
    async (href: string) => {
      if (!featuredResult) {
        return;
      }

      try {
        trackFeaturedResult({
          featuredResultCreativeId: featuredResult.advertiserId,
          placementId: featuredResult.placementSlug,
          impressionId: featuredResult.impressionId,
          type: TrackFeaturedResultType.Click,
        });

        navigate(Routes.DAPP_BROWSER_SCREEN, {
          url: href,
        });
      } catch (error) {
        logger.warn(`[FeaturedResultCard] Error tracking featured result click`, { error });
      }
    },
    [featuredResult, trackFeaturedResult, navigate]
  );

  if (!featuredResult) {
    return null;
  }

  return (
    <ColorModeProvider value={isDarkMode ? 'darkTinted' : 'lightTinted'}>
      <GenericCard gradient={gradient} testID={`featured-result-card-${featuredResult.id}`} type={cardType}>
        <Stack space="8px">
          <Text size="17pt" weight="heavy" color={{ custom: textColor }} numberOfLines={2}>
            {featuredResult.title}
          </Text>
          <Text
            size="13pt"
            weight="semibold"
            color={{ custom: opacity(getTintedBackgroundColor(textColors)[isDarkMode ? 'dark' : 'light'], 0.72) }}
            numberOfLines={2}
          >
            {featuredResult.description}
          </Text>
        </Stack>
        <Box
          marginTop={{ custom: 24 }}
          marginBottom={{ custom: 16 }}
          width={{ custom: IMAGE_WIDTH }}
          height={{ custom: IMAGE_HEIGHT }}
          borderRadius={24}
          overflow="hidden"
        >
          <ImgixImage
            aria-label={featuredResult.imageAltText}
            enableFasterImage
            size={IMAGE_WIDTH}
            source={{ uri: featuredResult.imageUrl }}
            style={styles.image}
          />
        </Box>

        {featuredResult.ctas && (
          <Columns alignVertical="center" space="12px">
            {featuredResult.ctas.map((cta, index) => (
              <Column key={index}>
                <GestureHandlerButton
                  key={index}
                  style={[styles.button, { backgroundColor: buttonColor }]}
                  onPressJS={() => handlePress(cta.href)}
                >
                  <Text size="15pt" weight="bold" color={{ custom: buttonTextColor }}>
                    {cta.title}
                  </Text>
                </GestureHandlerButton>
              </Column>
            ))}
          </Columns>
        )}
      </GenericCard>
    </ColorModeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 12,
  },
  button: {
    height: 36,
    borderRadius: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
