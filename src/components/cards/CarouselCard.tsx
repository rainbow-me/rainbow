import {
  Bleed,
  Box,
  Column,
  Columns,
  Inline,
  Stack,
  Text,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import React from 'react';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { ButtonPressAnimation } from '@/components/animations';
import { useDimensions } from '@/hooks';
import ActivityIndicator from '@/components/ActivityIndicator';
import { IS_ANDROID } from '@/env';
import Spinner from '@/components/Spinner';
import { ScrollView, View } from 'react-native';

const HORIZONTAL_PADDING = 20;

const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

type CarouselItem<T> = {
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  placeholder: React.ReactNode;
  width: number;
  height: number; // make sure to include extra 20px to accommodate for vertical bleed
  padding: number;
  verticalOverflow?: number;
};

export function CarouselCard<T>({
  title,
  data,
  carouselItem,
  button,
  menu,
  refresh,
  canRefresh,
  isRefreshing,
}: {
  title: string | React.ReactNode;
  data: T[] | null | undefined;
  carouselItem: CarouselItem<T>;
  button: React.ReactNode;
  menu?: React.ReactNode;
  refresh?: () => void;
  canRefresh?: boolean;
  isRefreshing?: boolean;
}) {
  const borderColor = useForegroundColor('separator');
  const { width: deviceWidth } = useDimensions();
  const { colorMode } = useColorMode();

  const actualItemHeight =
    carouselItem.height + (carouselItem.verticalOverflow ?? 0) * 2;

  return (
    <Stack space="20px">
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        {typeof title === 'string' ? (
          <Text color="label" weight="heavy" size="20pt">
            {title}
          </Text>
        ) : (
          <Box width="full">{title}</Box>
        )}
        {menu}
      </Box>
      {/* FlashList vertical visible overflow does not work due to a bug,
      so we need to manually add vertical padding to the recycled component.
      The vertical bleed here is to accommodate the vertical padding w/o affecting the layout. 
      See https://github.com/Shopify/flash-list/issues/723*/}
      <Bleed
        horizontal="20px"
        vertical={{ custom: carouselItem.verticalOverflow ?? 0 }}
      >
        <Box height={{ custom: actualItemHeight }}>
          {data?.length ? (
            <FlashList
              data={data}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: HORIZONTAL_PADDING,
              }}
              estimatedItemSize={carouselItem.width}
              horizontal
              estimatedListSize={{
                height: actualItemHeight,
                width: deviceWidth * 2,
              }}
              style={{ flex: 1 }}
              renderItem={info => (
                <View
                  style={{
                    paddingVertical: carouselItem.verticalOverflow,
                    alignItems: 'center',
                  }}
                >
                  {carouselItem.renderItem(info)}
                </View>
              )}
              ItemSeparatorComponent={() => (
                <View style={{ width: carouselItem.padding }} />
              )}
              keyExtractor={carouselItem.keyExtractor}
            />
          ) : (
            // need this due to FlashList bug https://github.com/Shopify/flash-list/issues/757
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: HORIZONTAL_PADDING,
              }}
            >
              <Inline space={{ custom: carouselItem.padding }}>
                {carouselItem.placeholder}
                {carouselItem.placeholder}
                {carouselItem.placeholder}
                {carouselItem.placeholder}
                {carouselItem.placeholder}
              </Inline>
            </ScrollView>
          )}
        </Box>
      </Bleed>
      <Columns space="10px">
        <Column>{button}</Column>
        {!!refresh && (
          <Column width="content">
            <Box
              as={ButtonPressAnimation}
              // @ts-ignore
              disabled={!canRefresh}
              onPress={refresh}
              justifyContent="center"
              alignItems="center"
              borderRadius={18}
              style={{
                borderWidth: isRefreshing ? 0 : 1,
                borderColor,
                width: 36,
                height: 36,
              }}
            >
              {isRefreshing ? (
                <LoadingSpinner
                  color={colorMode === 'light' ? 'black' : 'white'}
                  size={20}
                />
              ) : (
                <Text align="center" color="label" size="17pt" weight="bold">
                  􀅈
                </Text>
              )}
            </Box>
          </Column>
        )}
      </Columns>
    </Stack>
  );
}
