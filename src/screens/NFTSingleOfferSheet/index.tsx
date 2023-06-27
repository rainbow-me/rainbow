import React from 'react';
import { Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  Inline,
  Inset,
  Separator,
  Text,
  Columns,
  Column,
} from '@/design-system';
import { ImgixImage } from '@/components/images';
import {
  getFormattedTimeQuantity,
  convertAmountToNativeDisplay,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import * as i18n from '@/languages';
import { NftOffer } from '@/graphql/__generated__/arc';
import { CoinIcon } from '@/components/coin-icon';
import { ButtonPressAnimation } from '@/components/animations';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function Row({
  symbol,
  label,
  value,
}: {
  symbol: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box height={{ custom: 36 }} alignItems="center">
      <Columns>
        <Column>
          <Inline space="4px" alignVertical="center">
            <Box width={{ custom: 28 }}>
              <Text color="labelTertiary" size="15pt" weight="medium">
                {symbol}
              </Text>
            </Box>

            <Text color="labelTertiary" size="17pt" weight="medium">
              {label}
            </Text>
          </Inline>
        </Column>
        <Column>{value}</Column>
      </Columns>
    </Box>
  );
}

export function NFTSingleOfferSheet() {
  const { params } = useRoute();
  const { offer } = params as { offer: NftOffer };
  const isFloorDiffPercentagePositive = offer.floorDifferencePercentage >= 0;
  const listPrice = handleSignificantDecimals(
    offer.grossAmount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.grossAmount.decimal >= 10_000
  );
  const floorPrice = handleSignificantDecimals(
    offer.floorPrice.amount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.grossAmount.decimal >= 10_000
  );
  const netCurrency = convertAmountToNativeDisplay(
    offer.netAmount.usd,
    'USD',
    undefined,
    // don't show decimals
    false,
    // abbreviate if amount is >= 10,000
    offer.netAmount.decimal >= 10_000
  );
  const netCrypto = handleSignificantDecimals(
    offer.netAmount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.netAmount.decimal >= 10_000
  );
  const timeRemaining = offer.validUntil
    ? Math.max(offer.validUntil * 1000 - Date.now(), 0)
    : undefined;
  const isExpiring =
    timeRemaining !== undefined && timeRemaining <= TWO_HOURS_MS;
  const time = timeRemaining
    ? getFormattedTimeQuantity(timeRemaining)
    : undefined;

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="32px" horizontal="28px" bottom="52px">
            <Inset bottom={{ custom: 36 }}>
              <Text color="label" align="center" size="20pt" weight="heavy">
                Offer
              </Text>
              <Inset top="10px">
                <Inline
                  space="4px"
                  alignHorizontal="center"
                  alignVertical="center"
                >
                  <Text
                    color="labelTertiary"
                    align="center"
                    size="13pt"
                    weight="semibold"
                  >
                    􀐫
                  </Text>
                  <Text
                    color="labelTertiary"
                    align="center"
                    size="15pt"
                    weight="semibold"
                  >
                    Expires in
                  </Text>
                  <Text
                    color={isExpiring ? 'red' : 'labelTertiary'}
                    align="center"
                    size="15pt"
                    weight="semibold"
                  >
                    {time}
                  </Text>
                </Inline>
              </Inset>
            </Inset>

            <Box alignItems="center">
              <Box
                as={ImgixImage}
                background="surfacePrimary"
                source={{ uri: offer.nft.imageUrl }}
                width={{ custom: 160 }}
                height={{ custom: 160 }}
                borderRadius={16}
                size={160}
                shadow="30px"
              />
            </Box>

            <Inset top={{ custom: 40 }} bottom="24px">
              <Columns>
                <Column>
                  <Text color="label" size="17pt" weight="bold">
                    {offer.nft.name}
                  </Text>
                  <Inset top="10px">
                    <Text color="labelTertiary" size="13pt" weight="medium">
                      {offer.nft.collectionName}
                    </Text>
                  </Inset>
                </Column>
                <Column>
                  <Inline
                    space="4px"
                    alignVertical="center"
                    alignHorizontal="right"
                  >
                    <CoinIcon
                      address={offer.paymentToken.address}
                      size={16}
                      symbol={offer.paymentToken.symbol}
                    />

                    <Text color="label" align="right" size="17pt" weight="bold">
                      {listPrice} {offer.paymentToken.symbol}
                    </Text>
                  </Inline>

                  <Inset top="6px">
                    <Inline alignHorizontal="right">
                      <Text
                        size="13pt"
                        weight="medium"
                        color={
                          isFloorDiffPercentagePositive
                            ? 'green'
                            : 'labelTertiary'
                        }
                      >
                        {`${isFloorDiffPercentagePositive ? '+' : ''}${
                          offer.floorDifferencePercentage
                        }% `}
                      </Text>
                      <Text size="13pt" weight="medium" color="labelTertiary">
                        {i18n.t(
                          isFloorDiffPercentagePositive
                            ? i18n.l.nft_offers.sheet.above_floor
                            : i18n.l.nft_offers.sheet.below_floor
                        )}
                      </Text>
                    </Inline>
                  </Inset>
                </Column>
              </Columns>
            </Inset>

            <Separator color="separatorTertiary" />

            <Inset top="24px">
              <Row
                symbol="􀐾"
                label="Floor Price"
                value={
                  <Inline
                    space="4px"
                    alignVertical="center"
                    alignHorizontal="right"
                  >
                    <CoinIcon
                      address={offer.paymentToken.address}
                      size={16}
                      symbol={offer.paymentToken.symbol}
                    />

                    <Text
                      color="labelSecondary"
                      align="right"
                      size="17pt"
                      weight="medium"
                    >
                      {floorPrice} {offer.paymentToken.symbol}
                    </Text>
                  </Inline>
                }
              />

              <Row
                symbol="􀍩"
                label="Marketplace"
                value={
                  <Inline
                    space="4px"
                    alignVertical="center"
                    alignHorizontal="right"
                  >
                    <Box
                      as={ImgixImage}
                      background="surfacePrimary"
                      source={{ uri: offer.marketplace.imageUrl }}
                      width={{ custom: 16 }}
                      height={{ custom: 16 }}
                      borderRadius={16}
                      size={16}
                      shadow="30px accent"
                    />

                    <Text
                      color="labelSecondary"
                      align="right"
                      size="17pt"
                      weight="medium"
                    >
                      {offer.marketplace.name}
                    </Text>
                  </Inline>
                }
              />

              <Row
                symbol="􀘾"
                label={offer.marketplace.name + ' Fees'}
                value={
                  <Text
                    color="labelSecondary"
                    align="right"
                    size="17pt"
                    weight="medium"
                  >
                    {(offer.feesPercentage / 100).toFixed(1)}%
                  </Text>
                }
              />

              <Row
                symbol="􀣶"
                label="Creator Royalties"
                value={
                  <Text
                    color="labelSecondary"
                    align="right"
                    size="17pt"
                    weight="medium"
                  >
                    {offer.royaltiesPercentage}%
                  </Text>
                }
              />

              <Row
                symbol="􀖅"
                label="Receive"
                value={
                  <Text
                    color="labelSecondary"
                    align="right"
                    size="17pt"
                    weight="medium"
                  >
                    {offer.paymentToken.symbol}
                  </Text>
                }
              />
            </Inset>

            <Separator color="separatorTertiary" />

            <Inset vertical="24px">
              <Columns alignVertical="center">
                <Column>
                  <Text color="label" size="17pt" weight="bold">
                    Proceeds
                  </Text>
                </Column>
                <Column>
                  <Inline
                    space="4px"
                    alignVertical="center"
                    alignHorizontal="right"
                  >
                    <CoinIcon
                      address={offer.paymentToken.address}
                      size={16}
                      symbol={offer.paymentToken.symbol}
                    />

                    <Text color="label" align="right" size="17pt" weight="bold">
                      {netCrypto} {offer.paymentToken.symbol}
                    </Text>
                  </Inline>

                  <Inset top="10px">
                    <Text
                      color="labelTertiary"
                      align="right"
                      size="13pt"
                      weight="medium"
                    >
                      {netCurrency}
                    </Text>
                  </Inset>
                </Column>
              </Columns>
            </Inset>

            <AccentColorProvider color={offer.nft.predominantColor || 'accent'}>
              <BackgroundProvider color="accent">
                {({ backgroundColor }) => (
                  <>
                    {/* @ts-ignore js component */}
                    <Box
                      as={ButtonPressAnimation}
                      background="accent"
                      height="46px"
                      width="full"
                      borderRadius={99}
                      justifyContent="center"
                      alignItems="center"
                      style={{ overflow: 'hidden' }}
                      onPress={() => {
                        // TODO
                        // Linking.openURL(offer)
                      }}
                    >
                      <Text
                        color="label"
                        align="center"
                        size="15pt"
                        weight="bold"
                      >
                        View Offer
                      </Text>
                    </Box>
                  </>
                )}
              </BackgroundProvider>
            </AccentColorProvider>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
