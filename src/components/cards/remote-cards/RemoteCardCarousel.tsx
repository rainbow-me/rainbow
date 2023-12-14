import React, { useState, useRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { useRoute } from '@react-navigation/native';
import { IS_TESTING } from 'react-native-dotenv';

import {
  TrimmedCard,
  useRemoteCardContext,
  RemoteCard,
} from '@/components/cards/remote-cards';
import { Box, Separator } from '@/design-system';
import { REMOTE_CARDS, getExperimetalFlag } from '@/config';
import Animated from 'react-native-reanimated';
import { useDimensions } from '@/hooks';
import { useTheme } from '@/theme';
import config from '@/model/config';

type RenderItemProps = {
  item: TrimmedCard;
  index: number;
};

export const RemoteCardCarousel = ({ withSeparator = true }) => {
  const { name } = useRoute();
  const remoteCardsEnabled =
    getExperimetalFlag(REMOTE_CARDS) || config.remote_cards_enabled;
  const { getCardsForPlacement } = useRemoteCardContext();
  const { isDarkMode } = useTheme();
  const [index, setIndex] = useState(0);
  const { width } = useDimensions();

  const carouselRef = useRef(null);

  const _renderItem = ({ item }: RenderItemProps) => {
    return <RemoteCard card={item} />;
  };

  const data = useMemo(() => getCardsForPlacement(name as string), [
    getCardsForPlacement,
    name,
  ]);

  if (IS_TESTING || !remoteCardsEnabled || !data.length) {
    return null;
  }

  return (
    <Box as={Animated.View} width="full">
      {withSeparator && <Separator color="separatorTertiary" thickness={1} />}
      <Carousel
        ref={carouselRef}
        data={data}
        containerCustomStyle={styles.slider}
        contentContainerCustomStyle={styles.sliderContentContainer}
        renderItem={_renderItem}
        removeClippedSubviews
        sliderWidth={width - 40}
        itemWidth={width - 40}
        inactiveSlideShift={0}
        scrollEnabled={data.length > 1}
        onSnapToItem={index => setIndex(index)}
      />
      {data.length > 1 && (
        <Pagination
          activeDotIndex={index}
          dotsLength={data.length}
          containerStyle={styles.paginationContainer}
          dotColor={isDarkMode ? '#F2F4FB' : '#C4C8D3'}
          dotStyle={styles.paginationDot}
          inactiveDotColor={isDarkMode ? '#C4C8D3' : '#F2F4FB'}
          inactiveDotOpacity={1}
          inactiveDotScale={1}
        />
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  slider: {
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  sliderContentContainer: {
    marginVertical: 0,
  },
  paginationContainer: {
    paddingTop: 16,
    paddingBottom: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 0,
  },
});

export default RemoteCardCarousel;
