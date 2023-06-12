import React, { useEffect, useState } from 'react';
import ConditionalWrap from 'conditional-wrap';
import { TextColor, globalColors } from '@/design-system/color/palettes';
import { ImgixImage } from '../../images';
import Svg, { Path } from 'react-native-svg';
import MaskedView from '@react-native-masked-view/masked-view';
import {
  convertAmountToNativeDisplay,
  getFormattedTimeQuantity,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import { CoinIcon } from '../../coin-icon';
import { NftOffer, SortCriterion } from '@/graphql/__generated__/arc';
import { useTheme } from '@/theme';
import {
  AccentColorProvider,
  Box,
  Inline,
  Text,
  useColorMode,
} from '@/design-system';
import { RainbowError, logger } from '@/logger';
import { ButtonPressAnimation } from '@/components/animations';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const NFT_IMAGE_SIZE = 78;

const NFTImageMask = () => (
  <Svg width="78" height="78" viewBox="0 0 78 78">
    <Path
      d="M77.9991 17.5233C77.9978 16.7078 77.9972 16.3001 77.9385 16.0639C77.7232 15.1985 77.3429 14.8188 76.4771 14.605C76.2409 14.5466 75.6569 14.5466 74.4887 14.5466V14.5466C68.3941 14.5466 63.4534 9.60592 63.4534 3.51125V3.51125C63.4534 2.34314 63.4534 1.75909 63.395 1.52285C63.1812 0.657103 62.8015 0.276763 61.936 0.0615435C61.6999 0.00281707 61.2922 0.00216367 60.4767 0.000856855C59.942 0 59.3837 0 58.8 0H19.2C12.4794 0 9.11905 0 6.55211 1.30792C4.29417 2.4584 2.4584 4.29417 1.30792 6.55211C0 9.11905 0 12.4794 0 19.2V58.8C0 65.5206 0 68.8809 1.30792 71.4479C2.4584 73.7058 4.29417 75.5416 6.55211 76.6921C9.11905 78 12.4794 78 19.2 78H58.8C65.5206 78 68.8809 78 71.4479 76.6921C73.7058 75.5416 75.5416 73.7058 76.6921 71.4479C78 68.8809 78 65.5206 78 58.8V19.2C78 18.6163 78 18.058 77.9991 17.5233Z"
      fill="black"
    />
  </Svg>
);

export const FakeOffer = () => {
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
            height={{ custom: 9.3333 }}
            borderRadius={9.3333 / 2}
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

export const Offer = ({
  offer,
  sortCriterion,
}: {
  offer: NftOffer;
  sortCriterion: SortCriterion;
}) => {
  const [timeRemaining, setTimeRemaining] = useState(
    offer.validUntil
      ? Math.max(offer.validUntil * 1000 - Date.now(), 0)
      : undefined
  );

  const { colorMode } = useColorMode();
  useEffect(() => {
    if (offer.validUntil) {
      const interval = setInterval(() => {
        setTimeRemaining(Math.max(offer.validUntil! * 1000 - Date.now(), 0));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [offer.validUntil]);

  const isFloorDiffPercentagePositive = offer.floorDifferencePercentage >= 0;
  const isExpiring =
    timeRemaining !== undefined && timeRemaining <= TWO_HOURS_MS;

  let textColor: TextColor;
  let text;
  switch (sortCriterion) {
    case SortCriterion.TopBidValue:
    case SortCriterion.DateCreated:
      if (isExpiring) {
        textColor = 'red';
        text = getFormattedTimeQuantity(timeRemaining);
      } else {
        textColor = 'labelTertiary';
        text = convertAmountToNativeDisplay(
          offer.grossAmount.usd,
          'USD',
          undefined,
          true,
          offer.grossAmount.usd >= 10_000
        );
      }
      break;
    case SortCriterion.FloorDifferencePercentage:
      if (isExpiring) {
        textColor = 'red';
        text = getFormattedTimeQuantity(timeRemaining);
      } else if (isFloorDiffPercentagePositive) {
        textColor = 'green';
        text = `+${offer.floorDifferencePercentage}%`;
      } else {
        textColor = 'labelTertiary';
        text = `${offer.floorDifferencePercentage}%`;
      }
      break;
    default:
      textColor = 'labelTertiary';
      text = '';
      logger.error(new RainbowError('NFTOffersCard: invalid sort criterion'));
      break;
  }

  return (
    <ButtonPressAnimation>
      {isExpiring && (
        <Box
          width={{ custom: 19 }}
          height={{ custom: 19 }}
          right={{ custom: -6.25 }}
          top={{ custom: -5.75 }}
          style={{ zIndex: 1 }}
          position="absolute"
          alignItems="center"
          justifyContent="center"
        >
          <Text size="15pt" weight="bold" align="center" color="red">
            􀐬
          </Text>
        </Box>
      )}
      <Box
        style={{
          shadowColor: globalColors.grey100,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.02,
          shadowRadius: 3,
        }}
      >
        <Box
          style={{
            shadowColor:
              colorMode === 'dark' || !offer.nft.predominantColor
                ? globalColors.grey100
                : offer.nft.predominantColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 9,
          }}
        >
          <ConditionalWrap
            condition={isExpiring}
            wrap={(children: React.ReactNode) => (
              <MaskedView
                style={{
                  width: NFT_IMAGE_SIZE,
                  height: NFT_IMAGE_SIZE,
                }}
                maskElement={<NFTImageMask />}
              >
                {children}
              </MaskedView>
            )}
          >
            <Box
              as={ImgixImage}
              background="surfacePrimary"
              source={{ uri: offer.nft.imageUrl }}
              width={{ custom: NFT_IMAGE_SIZE }}
              height={{ custom: NFT_IMAGE_SIZE }}
              borderRadius={12}
              size={NFT_IMAGE_SIZE}
            />
          </ConditionalWrap>
        </Box>
      </Box>
      <Box paddingBottom={{ custom: 7 }} paddingTop={{ custom: 12 }}>
        <Inline space="4px" alignVertical="center">
          <CoinIcon
            address={offer.paymentToken.address}
            size={12}
            symbol={offer.paymentToken.symbol}
          />
          <Text color="label" size="13pt" weight="heavy">
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
