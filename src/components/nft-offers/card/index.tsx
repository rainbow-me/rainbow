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
import { ButtonPressAnimation, ShimmerAnimation } from '../../animations';
import { useAccountSettings, useDimensions } from '@/hooks';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { haptics } from '@/utils';
import { RainbowError, logger } from '@/logger';
import { ScrollView } from 'react-native';
import { useNFTOffers } from '@/resources/nftOffers';
import { SortCriterion } from '@/graphql/__generated__/arc';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FakeOffer, Offer } from './Offer';

const CARD_HEIGHT = 250;
const MAX_OFFERS = 20;

type SortOption = { name: string; icon: string; criterion: SortCriterion };

const SortOptions = {
  Highest: {
    name: i18n.t(i18n.l.nftOffers.card.sortCriteria.highest),
    icon: '􀑁',
    criterion: SortCriterion.TopBidValue,
  },
  FromFloor: {
    name: i18n.t(i18n.l.nftOffers.card.sortCriteria.fromFloor),
    icon: '􀅺',
    criterion: SortCriterion.FloorDifferencePercentage,
  },
  Recent: {
    name: i18n.t(i18n.l.nftOffers.card.sortCriteria.recent),
    icon: '􀐫',
    criterion: SortCriterion.DateCreated,
  },
} as const;

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

  const [hasOffers, setHasOffers] = useReducer(() => true, false);

  // only show the first MAX_OFFERS offers
  const offers = (data?.nftOffers ?? []).slice(0, MAX_OFFERS);

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
    true
  );

  const menuConfig = {
    menuTitle: '',
    menuItems: [
      {
        actionKey: SortOptions.Highest.criterion,
        actionTitle: SortOptions.Highest.name,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'chart.line.uptrend.xyaxis',
        },
        menuState:
          sortOption.criterion === SortOptions.Highest.criterion ? 'on' : 'off',
      },
      {
        actionKey: SortOptions.FromFloor.criterion,
        actionTitle: SortOptions.FromFloor.name,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'plus.forwardslash.minus',
        },
        menuState:
          sortOption.criterion === SortOptions.FromFloor.criterion
            ? 'on'
            : 'off',
      },
      {
        actionKey: SortOptions.Recent.criterion,
        actionTitle: SortOptions.Recent.name,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'clock',
        },
        menuState:
          sortOption.criterion === SortOptions.Recent.criterion ? 'on' : 'off',
      },
    ],
  };

  const onPressMenuItem = ({
    nativeEvent: { actionKey },
  }: {
    nativeEvent: { actionKey: SortCriterion };
  }) => {
    haptics.selection();
    switch (actionKey) {
      case SortOptions.Highest.criterion:
        setSortOption(SortOptions.Highest);
        break;
      case SortOptions.FromFloor.criterion:
        setSortOption(SortOptions.FromFloor);
        break;
      case SortOptions.Recent.criterion:
        setSortOption(SortOptions.Recent);
        break;
      default:
        logger.error(
          new RainbowError('NFTOffersCard: invalid context menu key')
        );
        break;
    }
  };

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
                          ? i18n.t(i18n.l.nftOffers.card.title.singular)
                          : i18n.t(i18n.l.nftOffers.card.title.plural, {
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
                <ContextMenuButton
                  menuConfig={menuConfig}
                  onPressMenuItem={onPressMenuItem}
                >
                  <ButtonPressAnimation>
                    <Inline alignVertical="center">
                      <Text size="15pt" weight="bold" color="labelTertiary">
                        {sortOption.icon}
                      </Text>
                      <Text color="label" size="17pt" weight="bold">
                        {` ${sortOption.name} `}
                      </Text>
                      <Text color="label" size="15pt" weight="bold">
                        􀆈
                      </Text>
                    </Inline>
                  </ButtonPressAnimation>
                </ContextMenuButton>
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
                        offers.map(offer => (
                          <Offer
                            key={offer.contractAddress + offer.tokenId}
                            offer={offer}
                            sortCriterion={sortOption.criterion}
                          />
                        ))
                      )}
                    </Inline>
                  </Inset>
                </ScrollView>
              </Bleed>
              <Box
                as={ButtonPressAnimation}
                background="fillSecondary"
                height="36px"
                width="full"
                borderRadius={99}
                justifyContent="center"
                alignItems="center"
                style={{ overflow: 'hidden' }}
              >
                {/* unfortunately shimmer width must be hardcoded */}
                <ShimmerAnimation
                  color={buttonColor}
                  width={deviceWidth - 40}
                />
                <Text color="label" align="center" size="15pt" weight="bold">
                  {i18n.t(i18n.l.nftOffers.card.button)}
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
