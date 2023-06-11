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
import { OfferRow } from './components/OfferRow';
import { useAccountProfile } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { ContactAvatar } from '@/components/contacts';
import { useNFTOffers } from '@/resources/nftOffers';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import {
  SortMenu,
  SortOption,
  SortOptions,
} from '@/components/nft-offers/SortMenu';
import * as i18n from '@/languages';

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

  const { data } = useNFTOffers({
    walletAddress: accountAddress,
    sortBy: sortOption.criterion,
  });

  const offers = data?.nftOffers ?? [];

  const totalUSDValue = offers.reduce(
    (acc, offer) => acc + offer.grossAmount.usd,
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
                      // @ts-expect-error Box is demanding a background prop but I REFUSE to yield
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
                    <Text
                      color="labelTertiary"
                      align="center"
                      size="15pt"
                      weight="bold"
                    >
                      {offers.length}
                    </Text>
                  </Box>
                </Inline>
                <Inline alignHorizontal="justify" alignVertical="center">
                  <Stack space="10px">
                    <Text size="15pt" weight="semibold" color="labelSecondary">
                      {i18n.t(i18n.l.nft_offers.sheet.total)}
                    </Text>
                    <Text size="22pt" weight="heavy" color="label">
                      {totalValue}
                    </Text>
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
                {offers.map(offer => (
                  <OfferRow key={offer.nft.uniqueId} offer={offer} />
                ))}
              </Stack>
            </Inset>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};
