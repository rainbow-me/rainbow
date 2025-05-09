import { MintableCollection, MintedNft } from '@/graphql/__generated__/arc';
import React, { useEffect, useState } from 'react';
import { getTimeElapsedFromDate } from '../utils';
import { Bleed, Box, Cover, Inline, Inset, Stack, Text, useForegroundColor } from '@/design-system';
import { abbreviateNumber, convertRawAmountToRoundedDecimal } from '@/helpers/utilities';
import { ButtonPressAnimation } from '@/components/animations';
import { Placeholder, RecentMintCell } from './RecentMintCell';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { analytics } from '@/analytics';
import * as i18n from '@/languages';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { navigateToMintCollection } from '@/resources/reservoir/mints';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const NUM_NFTS = 3;

export function Card({ collection }: { collection: MintableCollection }) {
  const { isDarkMode } = useTheme();

  const [timeElapsed, setTimeElapsed] = useState(
    collection.firstEvent ? getTimeElapsedFromDate(new Date(collection.firstEvent)) : undefined
  );

  const separator = useForegroundColor('separator');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const price = convertRawAmountToRoundedDecimal(collection.mintStatus.price, 18, 6);
  const currencySymbol = useBackendNetworksStore.getState().getChainsNativeAsset()[collection.chainId].symbol;
  const isFree = !price;

  // update elapsed time every minute if it's less than an hour
  useEffect(() => {
    if (timeElapsed && timeElapsed[timeElapsed.length - 1] === 'm') {
      const interval = setInterval(() => {
        setTimeElapsed(getTimeElapsedFromDate(new Date(collection.firstEvent)));
      }, 60_000);
      return () => clearInterval(interval);
    }
  });

  return (
    <View style={{ paddingHorizontal: 20, marginVertical: 20 }}>
      <Stack space="20px">
        <Stack space="12px">
          <Box>
            <Inset right={{ custom: 28 }}>
              <Text size="20pt" weight="heavy" color="label" numberOfLines={2}>
                {collection.name}
              </Text>
            </Inset>
            <Cover alignVertical="top" alignHorizontal="right">
              <Bleed vertical="3px">
                <ChainImage chainId={collection.chainId} position="relative" size={20} />
              </Bleed>
            </Cover>
          </Box>
          <Inline space="3px" alignVertical="center">
            <Text size="11pt" weight="semibold" color="labelQuaternary">
              􀐫
            </Text>
            <Inline alignVertical="center">
              <Text size="13pt" weight="semibold" color="labelTertiary">
                {timeElapsed
                  ? `${i18n.t(i18n.l.mints.mints_sheet.card.x_ago, {
                      timeElapsed,
                    })} · `
                  : ''}
                {collection.totalMints
                  ? `${i18n.t(i18n.l.mints.mints_sheet.card.x_mints, {
                      numMints: abbreviateNumber(collection.totalMints),
                    })} · `
                  : ''}
                {collection.mintsLastHour === 1
                  ? i18n.t(i18n.l.mints.mints_sheet.card.one_mint_past_hour)
                  : i18n.t(i18n.l.mints.mints_sheet.card.x_mints_past_hour, {
                      numMints: collection.mintsLastHour,
                    })}
              </Text>
            </Inline>
          </Inline>
        </Stack>
        <Inline space="10px">
          {collection.recentMints.slice(0, 3).map((mint: MintedNft) => (
            <RecentMintCell key={mint.tokenID} recentMint={mint} />
          ))}
          {Array.from({
            length: Math.max(NUM_NFTS - collection.recentMints.length, 0),
          }).map((_, index) => (
            <Placeholder key={index} />
          ))}
        </Inline>
        <ButtonPressAnimation
          onPress={() => {
            analytics.track(analytics.event.mintsPressedMintButton, {
              contractAddress: collection.contractAddress,
              chainId: collection.chainId,
              priceInEth: price,
            });
            navigateToMintCollection(collection.contract, collection.mintStatus.price, collection.chainId);
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
              <Text color="labelTertiary" size="13pt" weight="bold" align="center">
                {isFree ? i18n.t(i18n.l.mints.mints_sheet.card.free) : `${price} ${currencySymbol}`}
              </Text>
            </Box>
          </Inline>
        </ButtonPressAnimation>
      </Stack>
    </View>
  );
}
