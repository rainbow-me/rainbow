import React, { useState } from 'react';
import { useRoute } from '@react-navigation/native';
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
import { NftOffer } from '@/graphql/__generated__/arc';

const PROFILE_AVATAR_SIZE = 36;

export function NFTSingleOfferSheet({ offer }: { offer: NftOffer }) {
  const { params } = useRoute();
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const {
    accountColor,
    accountImage,
    accountSymbol,
    accountAddress,
  } = useAccountProfile();

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="20px" horizontal="20px" bottom="52px">
            <Inset bottom="24px"></Inset>
            <Separator color="separatorTertiary" />
            <Inset top="20px"></Inset>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
