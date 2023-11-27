import { useRoute } from '@react-navigation/native';
import React, { useState, useRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import Carousel, { Pagination } from 'react-native-snap-carousel'; // Version can be specified in package.json
import { TrimmedCard, useRemoteCardContext } from './RemoteCardProvider';
import { RemoteCard } from './RemoteCard';
import { Box, Separator } from '@/design-system';
import { REMOTE_CARDS, getExperimetalFlag } from '@/config';
import Animated from 'react-native-reanimated';
import { useDimensions } from '@/hooks';

type RenderItemProps = {
  item: TrimmedCard;
  index: number;
};

export const RemoteCardCarousel = ({ withSeparator = true }) => {
  const { name } = useRoute();
  const remoteCardsEnabled = getExperimetalFlag(REMOTE_CARDS);
  const { getCardsForPlacement } = useRemoteCardContext();
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

  if (!remoteCardsEnabled || !data.length) {
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
        sliderWidth={width - 40}
        itemWidth={width - 40}
        inactiveSlideShift={0}
        onSnapToItem={index => setIndex(index)}
      />
      {data.length > 1 && (
        <Pagination
          activeDotIndex={index}
          dotsLength={data.length}
          containerStyle={styles.paginationContainer}
          dotColor={'#C4C8D3'}
          dotStyle={styles.paginationDot}
          inactiveDotColor={'#F2F4FB'}
          inactiveDotOpacity={1}
          inactiveDotScale={1}
        />
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  slider: {
    marginTop: 12,
    marginBottom: 0,
    paddingBottom: 0,
  },
  sliderContentContainer: {
    marginVertical: 0,
  },
  paginationContainer: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 0,
  },
});

export default RemoteCardCarousel;
