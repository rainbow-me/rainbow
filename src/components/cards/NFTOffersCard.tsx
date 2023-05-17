import {
  AccentColorProvider,
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
import Svg, { Path } from 'react-native-svg';
import MaskedView from '@react-native-masked-view/masked-view';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const NFT_IMAGE_SIZE = 77.75;

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

const getFormattedTimeRemaining = (ms: number): string => {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const formattedMinutes = hours && !minutes ? '' : minutes + 'm';
  const formattedHours = hours ? hours + 'h ' : '';

  return formattedHours + formattedMinutes;
};

const NFTImageMask = () => (
  <Svg width="77.75" height="77.75" viewBox="0 0 77.75 77.75">
    <Path
      d="M77.749 17.9662C77.7477 17.1595 77.747 16.7562 77.6896 16.5228C77.4757 15.6521 77.0923 15.2694 76.2212 15.0569C75.9877 15 75.4085 15 74.25 15V15C68.1749 15 63.25 10.0751 63.25 4V4C63.25 2.84152 63.25 2.26229 63.1931 2.02879C62.9806 1.15771 62.5979 0.774301 61.7272 0.56038C61.4938 0.503038 61.0905 0.502343 60.2838 0.500952C59.7318 0.5 59.1545 0.5 58.55 0.5H19.2C12.4794 0.5 9.11905 0.5 6.55211 1.80792C4.29417 2.9584 2.4584 4.79417 1.30792 7.05211C0 9.61905 0 12.9794 0 19.7V59.05C0 65.7706 0 69.1309 1.30792 71.6979C2.4584 73.9558 4.29417 75.7916 6.55211 76.9421C9.11905 78.25 12.4794 78.25 19.2 78.25H58.55C65.2706 78.25 68.6309 78.25 71.1979 76.9421C73.4558 75.7916 75.2916 73.9558 76.4421 71.6979C77.75 69.1309 77.75 65.7706 77.75 59.05V19.7C77.75 19.0955 77.75 18.5182 77.749 17.9662Z"
      fill="black"
    />
  </Svg>
);

const NFTImage = ({ url }: { url: string }) => (
  <Box
    as={ImgixImage}
    width={{ custom: NFT_IMAGE_SIZE }}
    height={{ custom: NFT_IMAGE_SIZE }}
    source={{ uri: url }}
    borderRadius={12}
    shadow="18px"
  />
);

const FakeOffer = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.skeleton}>
      <Box
        background="accent"
        width={{ custom: NFT_IMAGE_SIZE }}
        height={{ custom: NFT_IMAGE_SIZE }}
        borderRadius={12}
      />
      <Box paddingBottom={{ custom: 7 }} paddingTop={{ custom: 12 }}>
        <Inline space="4px" alignVertical="center">
          <Box
            background="accent"
            width={{ custom: 12 }}
            height={{ custom: 12 }}
            borderRadius={6}
          />
          <Box
            background="accent"
            width={{ custom: 50 }}
            height={{ custom: 12 }}
            borderRadius={6}
          />
        </Inline>
      </Box>
      <Box
        background="accent"
        width={{ custom: 50 }}
        height={{ custom: 9.3333 }}
        borderRadius={9.3333 / 2}
      />
    </AccentColorProvider>
  );
};

const Offer = ({
  offer,
  sortCriterion,
}: {
  offer: NftOffer;
  sortCriterion: SortCriterion;
}) => {
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
          'USD',
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
    <ButtonPressAnimation>
      {lessThanTwoHoursRemaining ? (
        <>
          <Box
            width={{ custom: 19 }}
            height={{ custom: 19 }}
            right={{ custom: -6 }}
            top={{ custom: -6 }}
            position="absolute"
            alignItems="center"
            justifyContent="center"
          >
            <Text size="15pt" weight="bold" align="center" color="red">
              􀐬
            </Text>
          </Box>
          <MaskedView
            style={{
              width: NFT_IMAGE_SIZE,
              height: NFT_IMAGE_SIZE,
            }}
            maskElement={<NFTImageMask />}
          >
            <NFTImage url={offer.imageUrl} />
          </MaskedView>
        </>
      ) : (
        <NFTImage url={offer.imageUrl} />
      )}
      <Box paddingBottom={{ custom: 7 }} paddingTop={{ custom: 12 }}>
        <Inline space="4px" alignVertical="center">
          <CoinIcon
            address={offer.offerPaymentToken.address}
            size={12}
            symbol={offer.offerPaymentToken.symbol}
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
      </Box>
      <Text color={textColor} size="13pt" weight="semibold">
        {text}
      </Text>
    </ButtonPressAnimation>
  );
};

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

  const offers = (data?.nftOffers ?? []).slice(0, 10);

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
                <Text weight="heavy" size="20pt">
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ overflow: 'visible' }}
          >
            <Inset horizontal="20px">
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
          <ShimmerAnimation color={buttonColor} width={deviceWidth - 40} />
          <Text align="center" size="15pt" weight="bold">
            {i18n.t(i18n.l.nftOffers.card.button)}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
};
