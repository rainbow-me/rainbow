/* eslint-disable no-nested-ternary */
import { Bleed, Box, Column, Columns, Stack, Text, useColorMode, useForegroundColor } from '@/design-system';
import React, { useEffect, useRef, useState } from 'react';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { ButtonPressAnimation } from '@/components/animations';
import { useDimensions } from '@/hooks';
import ActivityIndicator from '@/components/ActivityIndicator';
import { IS_ANDROID } from '@/env';
import Spinner from '@/components/Spinner';
import { ScrollView, View } from 'react-native';

const HORIZONTAL_PADDING = 20;

const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

function EmptyComponent({ emptyMessage }: { emptyMessage?: string }) {
  return (
    <Box height="full" width="full" justifyContent="center" alignItems="center">
      <Text color="labelQuaternary" size="15pt" weight="semibold" numberOfLines={1}>
        {emptyMessage}
      </Text>
    </Box>
  );
}

export type CarouselItem<T> = {
  carouselRef?: React.Ref<FlashList<T>>;
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
  emptyMessage = 'No items found',
  loading = false,
  refresh,
  dataUpdatedAt = Date.now(),
  isRefreshing = false,
}: {
  title?: string | React.ReactNode;
  data: T[] | null | undefined;
  carouselItem: CarouselItem<T>;
  button?: React.ReactNode;
  menu?: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  refresh?: () => void;
  dataUpdatedAt?: number;
  isRefreshing?: boolean;
}) {
  const { width: deviceWidth } = useDimensions();

  const actualItemHeight = carouselItem.height + (carouselItem.verticalOverflow ?? 0) * 2;

  return (
    <Stack space="20px">
      {!!title && (
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          {typeof title === 'string' ? (
            <Text color="label" weight="heavy" size="20pt">
              {title}
            </Text>
          ) : (
            <Box width="full">{title}</Box>
          )}
          {menu}
        </Box>
      )}
      {/* FlashList vertical visible overflow does not work due to a bug,
      so we need to manually add vertical padding to the recycled component.
      The vertical bleed here is to accommodate the vertical padding w/o affecting the layout. 
      See https://github.com/Shopify/flash-list/issues/723*/}
      <Bleed horizontal="20px" vertical={{ custom: carouselItem.verticalOverflow ?? 0 }}>
        <Box height={{ custom: actualItemHeight }}>
          {data?.length ? (
            <FlashList
              data={data}
              scrollEnabled={(data && data.length > 1) ?? true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: HORIZONTAL_PADDING,
              }}
              estimatedItemSize={carouselItem.width}
              horizontal
              ref={carouselItem.carouselRef}
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
              ItemSeparatorComponent={() => <View style={{ width: carouselItem.padding }} />}
              keyExtractor={carouselItem.keyExtractor}
            />
          ) : loading ? (
            // need this due to FlashList bug https://github.com/Shopify/flash-list/issues/757
            <ScrollView
              horizontal
              scrollEnabled={(data && data.length > 1) ?? true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: HORIZONTAL_PADDING,
                gap: carouselItem.padding,
              }}
            >
              <Box>{carouselItem.placeholder}</Box>
              <Box>{carouselItem.placeholder}</Box>
              <Box>{carouselItem.placeholder}</Box>
              <Box>{carouselItem.placeholder}</Box>
            </ScrollView>
          ) : (
            <EmptyComponent emptyMessage={emptyMessage} />
          )}
        </Box>
      </Bleed>
      {!!button && (
        <Columns space="10px">
          <Column>{button}</Column>
          {!!refresh && (
            <Column width="content">
              <RefreshButton refresh={refresh} isRefreshing={isRefreshing} dataUpdatedAt={dataUpdatedAt} />
            </Column>
          )}
        </Columns>
      )}
    </Stack>
  );
}

type RefreshButtonProps = {
  refresh: () => void;
  isRefreshing: boolean;
  dataUpdatedAt: number;
};

const RefreshButton = ({ refresh, isRefreshing, dataUpdatedAt }: RefreshButtonProps) => {
  const borderColor = useForegroundColor('separator');
  const { colorMode } = useColorMode();

  const [canRefresh, setCanRefresh] = useState(dataUpdatedAt < Date.now() - 30_000);
  const interval = useRef<NodeJS.Timer>();

  useEffect(() => {
    const checkRefresh = () => {
      const refreshable = dataUpdatedAt < Date.now() - 30_000;
      setCanRefresh(refreshable);
      if (refreshable) {
        interval.current && clearInterval(interval.current);
      }
    };

    checkRefresh();
    interval.current = setInterval(checkRefresh, 1000);

    return () => interval.current && clearInterval(interval.current);
  }, [dataUpdatedAt]);

  return (
    <Box
      as={ButtonPressAnimation}
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
        opacity: canRefresh ? 1 : 0.4,
      }}
    >
      {isRefreshing ? (
        <LoadingSpinner color={colorMode === 'light' ? 'black' : 'white'} size={20} />
      ) : (
        <Text align="center" color="label" size="17pt" weight="bold">
          􀅈
        </Text>
      )}
    </Box>
  );
};
