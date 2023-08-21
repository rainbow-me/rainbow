import {
  Bleed,
  Box,
  Column,
  Columns,
  Inline,
  Inset,
  Text,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import React from 'react';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import {
  ButtonPressAnimation,
  ShimmerAnimation,
} from '@/components/animations';
import { useDimensions } from '@/hooks';
import ActivityIndicator from '@/components/ActivityIndicator';
import { IS_ANDROID } from '@/env';
import Spinner from '@/components/Spinner';
import { ScrollView } from 'react-native';

const EFFECTIVE_HORIZONTAL_PADDING = 20;

const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

type CarouselItem<T> = {
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  placeholder: React.ReactNode;
  width: number;
  height: number;
  spaceBetween: number;
};

type Button = {
  onPress: () => void;
  text: string;
  style: 'fill' | 'outline';
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
  button: Button;
  menu?: React.ReactNode;
  refresh?: () => void;
  canRefresh?: boolean;
  isRefreshing?: boolean;
}) {
  const borderColor = useForegroundColor('separator');
  const buttonColor = useForegroundColor('fillSecondary');
  const { width: deviceWidth } = useDimensions();
  const { colorMode } = useColorMode();

  const horizontalPadding =
    EFFECTIVE_HORIZONTAL_PADDING - carouselItem.spaceBetween / 2;

  return (
    <Bleed horizontal="20px">
      <Box style={{ overflow: 'hidden' }}>
        <Inset horizontal="20px">
          <Inline alignVertical="center" alignHorizontal="justify">
            {typeof title === 'string' ? (
              <Text color="label" weight="heavy" size="20pt">
                {title}
              </Text>
            ) : (
              title
            )}
            {menu}
          </Inline>
          <Bleed horizontal="20px" vertical="10px">
            <Box height={{ custom: carouselItem.height }}>
              {data?.length ? (
                <FlashList
                  data={data}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: horizontalPadding,
                  }}
                  estimatedItemSize={carouselItem.width}
                  horizontal
                  estimatedListSize={{
                    height: carouselItem.height,
                    width: deviceWidth * 2,
                  }}
                  style={{ flex: 1 }}
                  renderItem={carouselItem.renderItem}
                  keyExtractor={carouselItem.keyExtractor}
                />
              ) : (
                // need this due to FlashList bug https://github.com/Shopify/flash-list/issues/757
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: horizontalPadding,
                  }}
                >
                  {carouselItem.placeholder}
                  {carouselItem.placeholder}
                  {carouselItem.placeholder}
                  {carouselItem.placeholder}
                  {carouselItem.placeholder}
                </ScrollView>
              )}
            </Box>
          </Bleed>
          <Columns space="10px">
            <Column>
              {/* @ts-ignore js component */}
              <Box
                as={ButtonPressAnimation}
                background={
                  button.style === 'fill' ? 'fillSecondary' : undefined
                }
                height="36px"
                width="full"
                borderRadius={99}
                justifyContent="center"
                alignItems="center"
                style={{
                  overflow: 'hidden',
                  borderWidth: button.style === 'outline' ? 1 : undefined,
                  borderColor: button.style === 'outline' ? 'blue' : undefined,
                }}
                onPress={button.onPress}
              >
                {/* unfortunately shimmer width must be hardcoded */}
                <ShimmerAnimation
                  color={buttonColor}
                  width={
                    deviceWidth -
                    2 * EFFECTIVE_HORIZONTAL_PADDING -
                    // 46 = 36px refresh button width + 10px spacing
                    (refresh ? 46 : 0)
                  }
                />
                <Text color="label" align="center" size="15pt" weight="bold">
                  {button.text}
                </Text>
              </Box>
            </Column>
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
                    <Text
                      align="center"
                      color="label"
                      size="17pt"
                      weight="bold"
                    >
                      􀅈
                    </Text>
                  )}
                </Box>
              </Column>
            )}
          </Columns>
        </Inset>
      </Box>
    </Bleed>
  );
}
