import {
  AccentColorProvider,
  Bleed,
  Box,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import React, { useEffect, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import {
  ButtonPressAnimation,
  ShimmerAnimation,
} from '@/components/animations';
import { useAccountSettings, useDimensions } from '@/hooks';
import { useNFTOffers } from '@/resources/nftOffers';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import * as i18n from '@/languages';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  CELL_HORIZONTAL_PADDING,
  FakeOffer,
  NFT_IMAGE_SIZE,
  Offer,
} from './Offer';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import {
  SortMenu,
  SortOption,
  SortOptions,
} from '@/components/nft-offers/SortMenu';
import { NftOffer } from '@/graphql/__generated__/arc';
import { analyticsV2 } from '@/analytics';
import { useTheme } from '@/theme';

const CARD_HEIGHT = 250;
const OFFER_CELL_HEIGHT = NFT_IMAGE_SIZE + 60;
const OFFER_CELL_WIDTH = NFT_IMAGE_SIZE + CELL_HORIZONTAL_PADDING * 2;

export const NFTOffersCard = () => {
  const [sortOption, setSortOption] = useState<SortOption>(SortOptions.Highest);
  const borderColor = useForegroundColor('separator');
  const buttonColor = useForegroundColor('fillSecondary');
  const { width: deviceWidth } = useDimensions();
  const { accountAddress } = useAccountSettings();
  const { colors } = useTheme();
  const { data, isLoading } = useNFTOffers({
    walletAddress: accountAddress,
    sortBy: sortOption.criterion,
  });
  const { navigate } = useNavigation();

  const [hasOffers, setHasOffers] = useState(false);

  // only show the first MAX_OFFERS offers
  const offers = data?.nftOffers ?? [];

  const heightValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: heightValue.value + 1,
    };
  });

  // animate in/out card depending on if there are offers
  useEffect(() => {
    if (!hasOffers) {
      if (offers.length) {
        setHasOffers(true);
        // -1 bc we still want to show the <Divider /> (thickness 1)
        heightValue.value = withTiming(CARD_HEIGHT - 1);
      }
    } else {
      if (!offers.length && !isLoading) {
        setHasOffers(false);
        heightValue.value = withTiming(1);
      }
    }
  }, [hasOffers, heightValue, isLoading, offers.length]);

  const totalUSDValue = offers.reduce(
    (acc: number, offer: NftOffer) => acc + offer.grossAmount.usd,
    0
  );

  const totalValue = convertAmountToNativeDisplay(
    totalUSDValue,
    'USD',
    undefined,
    true,
    totalUSDValue >= 10_000
  );

  return (
    <Bleed horizontal="20px">
      <Box style={{ overflow: 'hidden' }}>
        <Inset horizontal="20px">
          <Box as={Animated.View} width="full" style={[animatedStyle]}>
            <Stack space="20px">
              <Separator color="separator" thickness={1} />
              <Inline alignVertical="center" alignHorizontal="justify">
                <Inline alignVertical="center" space={{ custom: 7 }}>
                  {!offers.length ? (
                    <AccentColorProvider color={colors.skeleton}>
                      <Box
                        background="accent"
                        height={{ custom: 14 }}
                        width={{ custom: 157 }}
                        borderRadius={7}
                      />
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
                          <Text
                            align="center"
                            color="labelTertiary"
                            size="13pt"
                            weight="semibold"
                          >
                            {totalValue}
                          </Text>
                        </Box>
                      </Bleed>
                    </>
                  )}
                </Inline>
                <SortMenu
                  sortOption={sortOption}
                  setSortOption={setSortOption}
                  type="card"
                />
              </Inline>
              <Bleed horizontal="20px" vertical="10px">
                <Box height={{ custom: OFFER_CELL_HEIGHT }}>
                  <FlashList
                    data={offers}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 13 }}
                    ListEmptyComponent={() => (
                      <>
                        <FakeOffer />
                        <FakeOffer />
                        <FakeOffer />
                        <FakeOffer />
                        <FakeOffer />
                      </>
                    )}
                    estimatedItemSize={OFFER_CELL_WIDTH}
                    horizontal
                    estimatedListSize={{
                      height: OFFER_CELL_HEIGHT,
                      width: deviceWidth * 2,
                    }}
                    renderItem={({ item }) => (
                      <Offer
                        offer={item}
                        sortCriterion={sortOption.criterion}
                      />
                    )}
                    keyExtractor={offer => offer.nft.uniqueId}
                  />
                </Box>
              </Bleed>
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
                  analyticsV2.track(
                    analyticsV2.event.nftOffersOpenedOffersSheet,
                    { entryPoint: 'NFTOffersCard' }
                  );
                  navigate(Routes.NFT_OFFERS_SHEET);
                }}
              >
                {/* unfortunately shimmer width must be hardcoded */}
                <ShimmerAnimation
                  color={buttonColor}
                  width={deviceWidth - 40}
                />
                <Text color="label" align="center" size="15pt" weight="bold">
                  {i18n.t(i18n.l.nft_offers.card.button)}
                </Text>
              </Box>
              <Separator color="separator" thickness={1} />
            </Stack>
          </Box>
        </Inset>
      </Box>
    </Bleed>
  );
};
