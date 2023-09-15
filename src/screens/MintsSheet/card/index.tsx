import { MintableCollection, NftSample } from '@/graphql/__generated__/arc';
import React, { useEffect, useState } from 'react';
import { getTimeElapsedFromDate } from '../utils';
import {
  Bleed,
  Box,
  Inline,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { convertRawAmountToRoundedDecimal } from '@/helpers/utilities';
import { getNetworkObj } from '@/networks';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { CarouselCard } from '@/components/cards/CarouselCard';
import { ButtonPressAnimation } from '@/components/animations';
import { NFT_IMAGE_SIZE, Placeholder, RecentMintCell } from './RecentMintCell';
import { Linking, View } from 'react-native';
import { useTheme } from '@/theme';
import { analyticsV2 } from '@/analytics';
import * as i18n from '@/languages';
import ChainBadge from '@/components/coin-icon/ChainBadge';

export function Card({ collection }: { collection: MintableCollection }) {
  const { isDarkMode } = useTheme();

  const [timeElapsed, setTimeElapsed] = useState(
    getTimeElapsedFromDate(new Date(collection.firstEvent))
  );

  const separator = useForegroundColor('separator');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const price = convertRawAmountToRoundedDecimal(
    collection.mintStatus.price,
    18,
    6
  );
  const currencySymbol = getNetworkObj(
    getNetworkFromChainId(collection.chainId)
  ).nativeCurrency.symbol;
  const isFree = !price;

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
    <View style={{ paddingHorizontal: 20, marginVertical: 20 }}>
      <CarouselCard
        title={
          <Stack space="12px">
            <Inline alignVertical="center" alignHorizontal="justify">
              <Text size="20pt" weight="heavy" color="label" numberOfLines={2}>
                {collection.name}
              </Text>
              <Bleed vertical="3px">
                <ChainBadge
                  assetType={getNetworkFromChainId(collection.chainId)}
                  // marginBottom={8}
                  position="relative"
                  size="medium"
                />
              </Bleed>
            </Inline>
            <Inline space="3px" alignVertical="center">
              <Text size="11pt" weight="semibold" color="labelQuaternary">
                􀐫
              </Text>
              <Inline alignVertical="center">
                <Text size="13pt" weight="semibold" color="labelTertiary">
                  {i18n.t(i18n.l.mints.mints_sheet.card.x_ago, {
                    timeElapsed,
                  })}
                </Text>
                <Text size="13pt" weight="semibold" color="labelTertiary">
                  {' · '}
                  {collection.mintsLastHour === 1
                    ? i18n.t(i18n.l.mints.mints_sheet.card.one_mint_past_hour)
                    : i18n.t(i18n.l.mints.mints_sheet.card.x_mints_past_hour, {
                        numMints: collection.mintsLastHour,
                      })}
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
            onPress={() => {
              analyticsV2.track(analyticsV2.event.mintsPressedMintButton, {
                contractAddress: collection.contractAddress,
                chainId: collection.chainId,
                priceInEth: price,
              });
              Linking.openURL(collection.externalURL);
            }}
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
                  {` ${i18n.t(i18n.l.mints.mints_sheet.card.mint)}`}
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
