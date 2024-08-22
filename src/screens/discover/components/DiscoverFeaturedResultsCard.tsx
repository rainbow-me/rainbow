import React from 'react';
import { GenericCard } from '@/components/cards/GenericCard';
import { ImgixImage } from '@/components/images';
import { HORIZONTAL_PADDING } from './DiscoverHome';
import { deviceUtils } from '@/utils';
import { FeaturedResult } from '@/graphql/__generated__/arc';
import { StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = deviceUtils.dimensions;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const IMAGE_ASPECT_RATIO = 16 / 9;

type DiscoverFeaturedResultsCardProps = {
  handlePress: () => void;
  featuredResult: FeaturedResult;
};

export const DiscoverFeaturedResultsCard = ({ handlePress, featuredResult }: DiscoverFeaturedResultsCardProps) => {
  return (
    <GenericCard onPress={handlePress} padding={{ custom: 0 }} testID={`featured-result-card-${featuredResult.id}`} type="stretch">
      <ImgixImage
        aria-label={featuredResult.imageAltText}
        enableFasterImage
        size={CARD_WIDTH}
        source={{ uri: featuredResult.imageUrl }}
        style={styles.image}
      />
    </GenericCard>
  );
};

const styles = StyleSheet.create({
  image: {
    width: CARD_WIDTH,
    height: CARD_WIDTH / IMAGE_ASPECT_RATIO,
    borderRadius: 12,
  },
});
