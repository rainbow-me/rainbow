import React, { useState } from 'react';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { FakeOfferRow, OfferRow } from './OfferRow';
import { useAccountProfile } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { ContactAvatar } from '@/components/contacts';
import { nftOffersQueryKey, useNFTOffers } from '@/resources/nftOffers';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import {
  SortMenu,
  SortOption,
  SortOptions,
} from '@/components/nft-offers/SortMenu';
import * as i18n from '@/languages';
import { NftOffer } from '@/graphql/__generated__/arc';
import { ButtonPressAnimation } from '@/components/animations';
import { queryClient } from '@/react-query';

const PROFILE_AVATAR_SIZE = 36;

export const NFTOffersSheet = () => {
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const {
    accountColor,
    accountImage,
    accountSymbol,
    accountAddress,
  } = useAccountProfile();

  const [sortOption, setSortOption] = useState<SortOption>(SortOptions.Highest);

  const { data, dataUpdatedAt, isLoading } = useNFTOffers({
    walletAddress: accountAddress,
    sortBy: sortOption.criterion,
  });

  const offers = data?.nftOffers ?? [];

  const totalUSDValue = offers.reduce(
    (acc: number, offer: NftOffer) => acc + offer.grossAmount.usd,
    0
  );

  const totalValue = convertAmountToNativeDisplay(totalUSDValue, 'USD');

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="20px" horizontal="20px" bottom="52px">
            <Inset bottom="24px">
              <Stack space={{ custom: 30 }}>
                <Inline alignHorizontal="justify" alignVertical="center">
                  <AccentColorProvider color={accountColor}>
                    {accountImage ? (
                      <Box
                        as={ImgixImage}
                        background="surfaceSecondary"
                        width={{ custom: PROFILE_AVATAR_SIZE }}
                        height={{ custom: PROFILE_AVATAR_SIZE }}
                        borderRadius={PROFILE_AVATAR_SIZE / 2}
                        source={{ uri: accountImage }}
                        shadow="12px accent"
                      />
                    ) : (
                      <Box
                        as={ContactAvatar}
                        background="surfaceSecondary"
                        shadow="12px accent"
                        color={accountColor}
                        size="small_shadowless"
                        value={accountSymbol}
                      />
                    )}
                  </AccentColorProvider>
                  <Text size="20pt" weight="heavy" color="label" align="center">
                    {i18n.t(i18n.l.nft_offers.sheet.title)}
                  </Text>
                  <Box
                    width={{ custom: PROFILE_AVATAR_SIZE }}
                    height={{ custom: PROFILE_AVATAR_SIZE }}
                    borderRadius={PROFILE_AVATAR_SIZE / 2}
                    background="surfaceSecondary"
                    style={{
                      borderWidth: 1.5,
                      borderColor: separatorSecondary,
                    }}
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isLoading ? (
                      <Box
                        background="fillSecondary"
                        width={{ custom: 20 }}
                        height={{ custom: 15 }}
                        borderRadius={15 / 2}
                      />
                    ) : (
                      <Text
                        color="labelTertiary"
                        align="center"
                        size="15pt"
                        weight="bold"
                      >
                        {offers.length}
                      </Text>
                    )}
                  </Box>
                </Inline>
                <Inline alignHorizontal="justify" alignVertical="center">
                  <Stack space="10px">
                    <Text size="15pt" weight="semibold" color="labelSecondary">
                      {i18n.t(i18n.l.nft_offers.sheet.total)}
                    </Text>
                    {isLoading ? (
                      <Box
                        background="fillSecondary"
                        width={{ custom: 100 }}
                        height={{ custom: 15 }}
                        borderRadius={15 / 2}
                      />
                    ) : (
                      <Text size="22pt" weight="heavy" color="label">
                        {totalValue}
                      </Text>
                    )}
                  </Stack>
                  <SortMenu
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                    type="sheet"
                  />
                </Inline>
              </Stack>
            </Inset>
            <Separator color="separatorTertiary" />
            <Inset top="20px">
              <Stack space="20px">
                {/* eslint-disable-next-line no-nested-ternary */}
                {isLoading ? (
                  <>
                    <FakeOfferRow />
                    <FakeOfferRow />
                    <FakeOfferRow />
                    <FakeOfferRow />
                    <FakeOfferRow />
                    <FakeOfferRow />
                    <FakeOfferRow />
                    <FakeOfferRow />
                    <FakeOfferRow />
                    <FakeOfferRow />
                    <FakeOfferRow />
                  </>
                ) : offers.length ? (
                  offers.map((offer: NftOffer) => (
                    <OfferRow key={offer.nft.uniqueId} offer={offer} />
                  ))
                ) : (
                  <Box
                    paddingTop={{ custom: 180 }}
                    width="full"
                    alignItems="center"
                  >
                    <Stack space="36px">
                      <Text
                        align="center"
                        color="labelSecondary"
                        weight="bold"
                        size="20pt"
                      >
                        {i18n.t(i18n.l.nft_offers.sheet.no_offers_found)}
                      </Text>
                      <ButtonPressAnimation
                        onPress={() => {
                          // only allow refresh if data is at least 30 seconds old
                          if (
                            !dataUpdatedAt ||
                            Date.now() - dataUpdatedAt > 30_000
                          ) {
                            queryClient.invalidateQueries({
                              queryKey: nftOffersQueryKey({
                                address: accountAddress,
                                sortCriterion: sortOption.criterion,
                              }),
                            });
                          }
                        }}
                      >
                        <Text
                          align="center"
                          color="labelSecondary"
                          size="34pt"
                          weight="semibold"
                        >
                          􀅈
                        </Text>
                      </ButtonPressAnimation>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Inset>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};
