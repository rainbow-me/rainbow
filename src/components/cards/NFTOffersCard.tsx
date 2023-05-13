import {
  Bleed,
  Box,
  Inline,
  Inset,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import React, { useState } from 'react';
import { ButtonPressAnimation, ShimmerAnimation } from '../animations';
import { useAccountSettings, useDimensions } from '@/hooks';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { haptics } from '@/utils';
import { RainbowError, logger } from '@/logger';
import { ScrollView } from 'react-native';
import { CoinIcon } from '../coin-icon';
import { useNFTOffers } from '@/resources/nftOffers';
import { NftOffer, SortCriterion } from '@/graphql/__generated__/nfts';
import {
  convertAmountToNativeDisplay,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import { ImgixImage } from '../images';
import { isNil } from 'lodash';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

type SortOption = { name: string; icon: string; criterion: SortCriterion };

const SortOptions = {
  Highest: {
    name: 'Highest',
    icon: '􀑁',
    criterion: SortCriterion.TopBidValue,
  },
  FromFloor: {
    name: 'From Floor',
    icon: '􀅺',
    criterion: SortCriterion.FloorDifferencePercentage,
  },
  Recent: {
    name: 'Recent',
    icon: '􀐫',
    criterion: SortCriterion.DateCreated,
  },
} as const;

const getFormattedTimeRemaining = (ms: number): string => {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const formattedMinutes = hours && !minutes ? '' : minutes + 'm';
  const formattedHours = hours ? hours + 'h ' : '';

  return formattedHours + formattedMinutes;
};

const Offer = ({
  offer,
  sortCriterion,
}: {
  offer: NftOffer;
  sortCriterion: SortCriterion;
}) => {
  const { nativeCurrency } = useAccountSettings();
  const isFloorDiffPercentagePositive = offer.floorDifferencePercentage >= 0;
  const timeRemaining = offer.validUntil
    ? Math.max(offer.validUntil - Date.now(), 0)
    : undefined;
  const lessThanTwoHoursRemaining =
    !isNil(timeRemaining) && timeRemaining <= TWO_HOURS_MS;

  let textColor;
  let text;
  switch (sortCriterion) {
    case SortCriterion.TopBidValue:
    case SortCriterion.DateCreated:
      if (lessThanTwoHoursRemaining) {
        textColor = 'red';
        text = getFormattedTimeRemaining(timeRemaining);
      } else {
        textColor = 'labelTertiary';
        text = convertAmountToNativeDisplay(
          offer.grossAmount.usd,
          nativeCurrency,
          undefined,
          true,
          true
        );
      }
      break;
    case SortCriterion.FloorDifferencePercentage:
      if (lessThanTwoHoursRemaining) {
        textColor = 'red';
        text = getFormattedTimeRemaining(timeRemaining);
      } else if (isFloorDiffPercentagePositive) {
        textColor = 'green';
        text = `+${offer.floorDifferencePercentage}%`;
      } else {
        textColor = 'labelTertiary';
        text = `${offer.floorDifferencePercentage}%`;
      }
      break;
    default:
      logger.error(new RainbowError('NFTOffersCard: invalid sort criterion'));
      break;
  }

  return (
    <Stack space="12px">
      <Box
        as={ImgixImage}
        width={{ custom: 77.75 }}
        height={{ custom: 77.75 }}
        source={{ uri: offer.imageUrl }}
        borderRadius={12}
        shadow="18px"
      />
      <Stack space={{ custom: 7 }}>
        <Inline space="4px" alignVertical="center">
          <CoinIcon
            // mainnet_address={'0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'}
            // address="0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"
            address={offer.offerPaymentToken.address}
            size={12}
            // badgeSize="tiny"
            symbol={offer.offerPaymentToken.symbol}
            // type={AssetTypes.polygon}
          />
          <Text size="13pt" weight="heavy">
            {handleSignificantDecimals(
              offer.grossAmount.decimal,
              18,
              3,
              undefined,
              true
            )}
          </Text>
        </Inline>
        <Text color={textColor} size="13pt" weight="semibold">
          {text}
        </Text>
      </Stack>
    </Stack>
  );
};

export const NFTOffersCard = () => {
  const [sortOption, setSortOption] = useState<SortOption>(SortOptions.Highest);
  const borderColor = useForegroundColor('separator');
  const buttonColor = useForegroundColor('fillSecondary');
  const { width: deviceWidth } = useDimensions();
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { data } = useNFTOffers({
    walletAddress: accountAddress,
    sortBy: sortOption.criterion,
  });

  const offers = data?.nftOffers ?? [];

  const totalUSDValue = offers.reduce(
    (acc, offer) => acc + offer.grossAmount.usd,
    0
  );

  const totalValue = convertAmountToNativeDisplay(
    totalUSDValue,
    nativeCurrency,
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

  const onPressMenuItem = ({ nativeEvent: { actionKey } }) => {
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
    <Box width="full">
      <Stack space="20px">
        <Inline alignVertical="center" alignHorizontal="justify">
          <Inline alignVertical="center" space={{ custom: 7 }}>
            <Text weight="heavy" size="20pt">{`${offers.length} Offers`}</Text>
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
          </Inline>

          <ContextMenuButton
            menuConfig={menuConfig}
            // onPressAndroid={onPressAndroid}
            onPressMenuItem={onPressMenuItem}
          >
            <ButtonPressAnimation>
              <Inline alignVertical="center">
                <Text size="15pt" weight="bold" color="labelTertiary">
                  {sortOption.icon}
                </Text>
                <Text size="17pt" weight="bold">
                  {` ${sortOption.name} `}
                </Text>
                <Text size="15pt" weight="bold">
                  􀆈
                </Text>
              </Inline>
            </ButtonPressAnimation>
          </ContextMenuButton>
        </Inline>
        <Bleed horizontal="20px">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Inset horizontal="20px">
              <Inline space={{ custom: 14 }}>
                {offers.map(offer => (
                  <Offer
                    key={offer.contractAddress + offer.tokenId}
                    offer={offer}
                    sortCriterion={sortOption.criterion}
                  />
                ))}
                {offers.map(offer => (
                  <Offer
                    key={offer.contractAddress + offer.tokenId}
                    offer={offer}
                    sortCriterion={sortOption.criterion}
                  />
                ))}
                {offers.map(offer => (
                  <Offer
                    key={offer.contractAddress + offer.tokenId}
                    offer={offer}
                    sortCriterion={sortOption.criterion}
                  />
                ))}
                {offers.map(offer => (
                  <Offer
                    key={offer.contractAddress + offer.tokenId}
                    offer={offer}
                    sortCriterion={sortOption.criterion}
                  />
                ))}
                {offers.map(offer => (
                  <Offer
                    key={offer.contractAddress + offer.tokenId}
                    offer={offer}
                    sortCriterion={sortOption.criterion}
                  />
                ))}
                {offers.map(offer => (
                  <Offer
                    key={offer.contractAddress + offer.tokenId}
                    offer={offer}
                    sortCriterion={sortOption.criterion}
                  />
                ))}
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
          <ShimmerAnimation color={buttonColor} width={deviceWidth - 40} />
          <Text align="center" size="15pt" weight="bold">
            View All Offers
          </Text>
        </Box>
      </Stack>
    </Box>
  );
};
