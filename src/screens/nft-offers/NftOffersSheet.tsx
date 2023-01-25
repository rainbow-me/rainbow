import React from 'react';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import {
  BackgroundProvider,
  Box,
  globalColors,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { CoinIcon } from '@/utils';
import { ETH_ADDRESS } from '@rainbow-me/swaps';
import { ETH_SYMBOL } from '@/references';
import { OfferRow } from './components/OfferRow';

const PROFILE_AVATAR_SIZE = 36;
const NFT_SIZE = 50;

export const NftOffersSheet = () => {
  const separatorSecondary = useForegroundColor('separatorSecondary');

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="20px" horizontal="20px" bottom="52px">
            <Inset bottom="24px">
              <Stack space={{ custom: 30 }}>
                <Inline alignHorizontal="justify" alignVertical="center">
                  <Box
                    width={{ custom: PROFILE_AVATAR_SIZE }}
                    height={{ custom: PROFILE_AVATAR_SIZE }}
                    borderRadius={PROFILE_AVATAR_SIZE / 2}
                    background="blue"
                    shadow="12px"
                  />
                  <Text size="20pt" weight="heavy" color="label" align="center">
                    Offers
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
                      65
                    </Text>
                  </Box>
                </Inline>
                <Inline alignHorizontal="justify" alignVertical="center">
                  <Stack space="10px">
                    <Text size="15pt" weight="semibold" color="labelSecondary">
                      Total
                    </Text>
                    <Text size="22pt" weight="heavy" color="label">
                      $42,420.52
                    </Text>
                  </Stack>
                  <Box
                    as={ButtonPressAnimation}
                    background="surfaceSecondaryElevated"
                    width={{ custom: 144 }}
                    height={{ custom: 36 }}
                    borderRadius={99}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Inline space={{ custom: 5 }}>
                      <Text size="13pt" weight="heavy" color="labelSecondary">
                        􀅺
                      </Text>
                      <Text size="15pt" weight="bold" color="label">
                        From Floor 􀆈
                      </Text>
                    </Inline>
                  </Box>
                </Inline>
              </Stack>
            </Inset>
            <Separator color="separatorTertiary" />
            <Inset top="20px">
              <Stack space="20px">
                <OfferRow />
                <OfferRow />
                <OfferRow />
                <OfferRow />
                <OfferRow />
                <OfferRow />
                <OfferRow />
                <OfferRow />
                <OfferRow />
                <OfferRow />
                <OfferRow />
              </Stack>
            </Inset>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};
