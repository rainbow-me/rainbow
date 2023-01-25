import React from 'react';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import {
  BackgroundProvider,
  Box,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { OfferRow } from './components/OfferRow';
import { useAccountProfile } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { ContactAvatar } from '@/components/contacts';

const PROFILE_AVATAR_SIZE = 36;

export const NftOffersSheet = () => {
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const { accountColor, accountImage, accountSymbol } = useAccountProfile();

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="20px" horizontal="20px" bottom="52px">
            <Inset bottom="24px">
              <Stack space={{ custom: 30 }}>
                <Inline alignHorizontal="justify" alignVertical="center">
                  {accountImage ? (
                    // @ts-expect-error Box is demanding a background prop but I REFUSE to yield
                    <Box
                      as={ImgixImage}
                      width={{ custom: PROFILE_AVATAR_SIZE }}
                      height={{ custom: PROFILE_AVATAR_SIZE }}
                      borderRadius={PROFILE_AVATAR_SIZE / 2}
                      source={{ uri: accountImage }}
                      shadow="12px"
                    />
                  ) : (
                    // @ts-expect-error js componenet
                    <Box
                      as={ContactAvatar}
                      shadow="12px"
                      color={accountColor}
                      size="small_shadowless"
                      value={accountSymbol}
                    />
                  )}
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
