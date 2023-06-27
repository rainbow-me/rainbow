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
import React, { useEffect, useReducer, useState } from 'react';
import {
  ButtonPressAnimation,
  ShimmerAnimation,
} from '@/components/animations';
import { useAccountSettings, useDimensions } from '@/hooks';
import { ScrollView } from 'react-native';
import { useNFTOffers } from '@/resources/nftOffers';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FakeOffer, Offer } from './Offer';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import {
  SortMenu,
  SortOption,
  SortOptions,
} from '@/components/nft-offers/SortMenu';

const CARD_HEIGHT = 250;
const MAX_OFFERS = 10;

export const NFTOffersCard = () => {
  const [sortOption, setSortOption] = useState<SortOption>(SortOptions.Highest);
  const borderColor = useForegroundColor('separator');
  const buttonColor = useForegroundColor('fillSecondary');
  const { width: deviceWidth } = useDimensions();
  const { accountAddress } = useAccountSettings();
  const { data } = useNFTOffers({
    walletAddress: accountAddress,
    sortBy: sortOption.criterion,
  });
  const { colors } = useTheme();
  const { navigate } = useNavigation();

  const [hasOffers, setHasOffers] = useReducer(() => true, false);

  // only show the first MAX_OFFERS offers
  const offers = data?.nftOffers ?? [];

  const heightValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: heightValue.value + 1,
    };
  });

  useEffect(() => {
    if (!hasOffers && offers.length) {
      setHasOffers();
      // -1 bc we still want to show the <Divider /> (thickness 1)
      heightValue.value = withTiming(CARD_HEIGHT - 1);
    }
  }, [hasOffers, heightValue, offers.length]);

  const totalUSDValue = offers.reduce(
    (acc, offer) => acc + offer.grossAmount.usd,
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Inset horizontal="20px" vertical="10px">
                    <Inline space={{ custom: 14 }}>
                      {!offers.length ? (
                        <>
                          <FakeOffer />
                          <FakeOffer />
                          <FakeOffer />
                          <FakeOffer />
                          <FakeOffer />
                        </>
                      ) : (
                        offers
                          .slice(0, MAX_OFFERS)
                          .map(offer => (
                            <Offer
                              key={offer.nft.uniqueId}
                              offer={offer}
                              sortCriterion={sortOption.criterion}
                            />
                          ))
                      )}
                    </Inline>
                  </Inset>
                </ScrollView>
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
                onPress={() => navigate(Routes.NFT_OFFERS_SHEET)}
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
