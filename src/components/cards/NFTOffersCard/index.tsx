import {
  AccentColorProvider,
  Bleed,
  Box,
  Column,
  Columns,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import React, { useEffect, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import { useAccountSettings, useDimensions } from '@/hooks';
import { nftOffersQueryKey, useNFTOffers } from '@/resources/reservoir/nftOffersQuery';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import * as i18n from '@/languages';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CELL_HORIZONTAL_PADDING, FakeOffer, NFT_IMAGE_SIZE, Offer } from './Offer';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { SortMenu } from '@/components/nft-offers/SortMenu';
import { NftOffer } from '@/graphql/__generated__/arc';
import { analyticsV2 } from '@/analytics';
import { useTheme } from '@/theme';
import { queryClient } from '@/react-query';
import ActivityIndicator from '@/components/ActivityIndicator';
import { IS_ANDROID } from '@/env';
import Spinner from '@/components/Spinner';
import { ScrollView } from 'react-native';

const CARD_HEIGHT = 250;
const OFFER_CELL_HEIGHT = NFT_IMAGE_SIZE + 60;
const OFFER_CELL_WIDTH = NFT_IMAGE_SIZE + CELL_HORIZONTAL_PADDING * 2;

const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

export const NFTOffersCard = () => {
  const borderColor = useForegroundColor('separator');
  const buttonColor = useForegroundColor('fillSecondary');
  const { width: deviceWidth } = useDimensions();
  const { accountAddress } = useAccountSettings();
  const { colors } = useTheme();
  const {
    data: { nftOffers },
    isLoading,
    isFetching,
  } = useNFTOffers({
    walletAddress: accountAddress,
  });
  const { navigate } = useNavigation();
  const { colorMode } = useColorMode();

  const offers = nftOffers ?? [];
  const [hasOffers, setHasOffers] = useState(false);

  const heightValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: heightValue.value + 1,
    };
  });

  const [canRefresh, setCanRefresh] = useState(true);

  useEffect(() => {
    if (!canRefresh) {
      setTimeout(() => {
        setCanRefresh(true);
      }, 30_000);
    }
  }, [canRefresh]);

  // animate in/out card depending on if there are offers
  useEffect(() => {
    if (!hasOffers) {
      if (offers.length) {
        setHasOffers(true);
        // -1 bc we still want to show the <Divider /> (thickness 1)
        heightValue.value = withTiming(CARD_HEIGHT - 1);
      }
    } else {
      if (!offers.length && !isLoading && !isFetching) {
        setHasOffers(false);
        heightValue.value = withTiming(1);
      }
    }
  }, [hasOffers, heightValue, isFetching, isLoading, offers.length]);

  const totalUSDValue = offers.reduce((acc: number, offer: NftOffer) => acc + offer.grossAmount.usd, 0);

  const totalValue = convertAmountToNativeDisplay(totalUSDValue, 'USD', undefined, true, totalUSDValue >= 10_000);

  return (
    <Bleed horizontal="20px">
      <Box style={{ overflow: 'hidden' }}>
        <Inset horizontal="20px">
          <Box as={Animated.View} width="full" style={[animatedStyle]}>
            <Stack space="20px">
              <Separator color="separatorTertiary" thickness={1} />
              <Inline alignVertical="center" alignHorizontal="justify">
                <Inline alignVertical="center" space={{ custom: 7 }}>
                  {!offers.length ? (
                    <AccentColorProvider color={colors.skeleton}>
                      <Box background="accent" height={{ custom: 14 }} width={{ custom: 157 }} borderRadius={7} />
                    </AccentColorProvider>
                  ) : (
                    <>
                      <Text color="label" weight="heavy" size="20pt">
                        {offers.length === 1
                          ? i18n.t(i18n.l.nft_offers.card.title.singular)
                          : i18n.t(i18n.l.nft_offers.card.title.plural, {
                              numOffers: offers.length,
                            })}
                      </Text>
                      <Bleed vertical="4px">
                        <Box
                          style={{
                            borderWidth: 1,
                            borderColor,
                            borderRadius: 7,
                          }}
                          justifyContent="center"
                          alignItems="center"
                          padding={{ custom: 5 }}
                        >
                          <Text align="center" color="labelTertiary" size="13pt" weight="semibold">
                            {totalValue}
                          </Text>
                        </Box>
                      </Bleed>
                    </>
                  )}
                </Inline>
                <SortMenu type="card" />
              </Inline>
              <Bleed horizontal="20px" vertical="10px">
                <Box height={{ custom: OFFER_CELL_HEIGHT }}>
                  {offers.length ? (
                    <FlashList
                      data={offers}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 13 }}
                      estimatedItemSize={OFFER_CELL_WIDTH}
                      horizontal
                      estimatedListSize={{
                        height: OFFER_CELL_HEIGHT,
                        width: deviceWidth * 2,
                      }}
                      style={{ flex: 1 }}
                      renderItem={({ item }) => <Offer offer={item} />}
                      keyExtractor={offer => offer.nft.uniqueId + offer.createdAt}
                    />
                  ) : (
                    // need this due to FlashList bug https://github.com/Shopify/flash-list/issues/757
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 13 }}>
                      <FakeOffer />
                      <FakeOffer />
                      <FakeOffer />
                      <FakeOffer />
                      <FakeOffer />
                    </ScrollView>
                  )}
                </Box>
              </Bleed>
              <Columns space="10px">
                <Column>
                  {/* @ts-ignore js component */}
                  <Box
                    as={ButtonPressAnimation}
                    background="fillSecondary"
                    height="36px"
                    width="full"
                    borderRadius={99}
                    justifyContent="center"
                    alignItems="center"
                    style={{ overflow: 'hidden' }}
                    onPress={() => {
                      analyticsV2.track(analyticsV2.event.nftOffersOpenedOffersSheet, { entryPoint: 'NFTOffersCard' });
                      navigate(Routes.NFT_OFFERS_SHEET);
                    }}
                  >
                    {/* unfortunately shimmer width must be hardcoded */}
                    <ShimmerAnimation
                      color={buttonColor}
                      // 86 = 20px horizontal padding + 10px spacing + 36px refresh button width
                      width={deviceWidth - 86}
                    />
                    <Text color="label" align="center" size="15pt" weight="bold">
                      {i18n.t(i18n.l.nft_offers.card.button)}
                    </Text>
                  </Box>
                </Column>
                <Column width="content">
                  <Box
                    as={ButtonPressAnimation}
                    // @ts-ignore
                    disabled={!canRefresh}
                    onPress={() => {
                      setCanRefresh(false);
                      queryClient.invalidateQueries(
                        nftOffersQueryKey({
                          walletAddress: accountAddress,
                        })
                      );
                    }}
                    justifyContent="center"
                    alignItems="center"
                    borderRadius={18}
                    style={{
                      borderWidth: isFetching ? 0 : 1,
                      borderColor: borderColor,
                      width: 36,
                      height: 36,
                    }}
                  >
                    {isFetching ? (
                      <LoadingSpinner color={colorMode === 'light' ? 'black' : 'white'} size={20} />
                    ) : (
                      <Text align="center" color="label" size="17pt" weight="bold">
                        􀅈
                      </Text>
                    )}
                  </Box>
                </Column>
              </Columns>
              <Separator color="separatorTertiary" thickness={1} />
            </Stack>
          </Box>
        </Inset>
      </Box>
    </Bleed>
  );
};
