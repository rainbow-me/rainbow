import { MintableCollection, NftSample } from '@/graphql/__generated__/arc';
import React, { useEffect, useState } from 'react';
import { getTimeElapsedFromDate } from '../utils';
import { Box, Inline, Stack, Text, useForegroundColor } from '@/design-system';
import { convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { getNetworkObj } from '@/networks';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { CarouselCard } from '@/components/cards/CarouselCard';
import { ButtonPressAnimation } from '@/components/animations';
import { NFT_IMAGE_SIZE, Placeholder, RecentMintCell } from './RecentMintCell';
import { Linking, View } from 'react-native';
import { useTheme } from '@/theme';

export function Card({ collection }: { collection: MintableCollection }) {
  const { isDarkMode } = useTheme();

  const [timeElapsed, setTimeElapsed] = useState(
    getTimeElapsedFromDate(new Date(collection.firstEvent))
  );

  const separator = useForegroundColor('separator');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const price = convertRawAmountToDecimalFormat(collection.mintStatus.price);
  const currencySymbol = getNetworkObj(
    getNetworkFromChainId(collection.chainId)
  ).nativeCurrency.symbol;
  const isFree = price === '0';

  // update elapsed time every minute if it's less than an hour
  useEffect(() => {
    if (timeElapsed[timeElapsed.length - 1] === 'm') {
      const interval = setInterval(() => {
        setTimeElapsed(getTimeElapsedFromDate(new Date(collection.firstEvent)));
      }, 60_000);
      return () => clearInterval(interval);
    }
  });

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 1 }}>
      <CarouselCard
        title={
          <Stack space="12px">
            <Text size="20pt" weight="heavy" color="label" numberOfLines={2}>
              {collection.name}
            </Text>
            <Inline space="3px" alignVertical="center">
              <Text size="11pt" weight="semibold" color="labelQuaternary">
                􀐫
              </Text>
              <Inline alignVertical="center">
                <Text size="13pt" weight="semibold" color="labelTertiary">
                  {`${timeElapsed} ago`}
                </Text>
                <Text size="13pt" weight="semibold" color="labelTertiary">
                  {` · ${collection.mintsLastHour} mint${
                    collection.mintsLastHour !== 1 ? 's' : ''
                  } past hour`}
                </Text>
              </Inline>
            </Inline>
          </Stack>
        }
        data={collection.recentMints}
        carouselItem={{
          renderItem: ({ item }) => <RecentMintCell recentMint={item} />,
          keyExtractor: (item: NftSample) => item.tokenID,
          placeholder: <Placeholder />,
          width: NFT_IMAGE_SIZE,
          height: NFT_IMAGE_SIZE,
          padding: 10,
          verticalOverflow: 20,
        }}
        button={
          <ButtonPressAnimation
            onPress={() => Linking.openURL(collection.externalURL)}
            style={{
              borderRadius: 99,
              borderWidth: 1,
              borderColor: isDarkMode ? separator : 'rgba(9, 17, 31, 0.1)',
              paddingVertical: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Inline space="6px" alignVertical="center">
              <Inline>
                <Text size="15pt" weight="heavy" color="yellow">
                  􀫸
                </Text>
                <Text size="15pt" weight="heavy" color="label">
                  {` Mint`}
                </Text>
              </Inline>
              <Box
                borderRadius={7}
                padding={{ custom: 5.5 }}
                alignItems="center"
                justifyContent="center"
                background="fillSecondary"
                style={{ borderWidth: 1, borderColor: separatorTertiary }}
              >
                <Text
                  color="labelTertiary"
                  size="13pt"
                  weight="bold"
                  align="center"
                >
                  {isFree ? 'FREE' : `${price} ${currencySymbol}`}
                </Text>
              </Box>
            </Inline>
          </ButtonPressAnimation>
        }
      />
    </View>
  );
}
