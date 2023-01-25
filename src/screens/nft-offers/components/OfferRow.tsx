import React from 'react';
import {
  BackgroundProvider,
  Bleed,
  Box,
  Cover,
  globalColors,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { CoinIcon } from '@/utils';
import { ETH_ADDRESS } from '@rainbow-me/swaps';
import { ETH_SYMBOL } from '@/references';
import { NftImageMaskSvg } from './NftImageMaskSvg';
import MaskedView from '@react-native-masked-view/masked-view';

const NFT_SIZE = 50;
const MARKETPLACE_ORB_SIZE = 18;

export const OfferRow = () => {
  return (
    <Inline alignHorizontal="justify" alignVertical="center">
      <Inline space="16px" alignVertical="center">
        {/* <Box
          width={{ custom: NFT_SIZE }}
          height={{ custom: NFT_SIZE }}
          background="blue"
          shadow="12px"
          borderRadius={15}
          justifyContent="flex-end"
        > */}

        <Box>
          <MaskedView maskElement={<NftImageMaskSvg />}>
            <Box
              width={{ custom: NFT_SIZE }}
              height={{ custom: NFT_SIZE }}
              background="blue"
              shadow="12px"
              borderRadius={15}
              justifyContent="flex-end"
            ></Box>
          </MaskedView>
          <Cover>
            <Bleed left={{ custom: 5 }}>
              <Box
                width={{ custom: MARKETPLACE_ORB_SIZE }}
                height={{ custom: MARKETPLACE_ORB_SIZE }}
                borderRadius={MARKETPLACE_ORB_SIZE / 2}
                background="green"
                shadow="12px"
                marginTop={{ custom: NFT_SIZE - MARKETPLACE_ORB_SIZE + 5 }}
                marginRight={{ custom: NFT_SIZE - MARKETPLACE_ORB_SIZE + 5 }}
              />
            </Bleed>
          </Cover>
        </Box>
        <Stack space="10px">
          <Text size="17pt" weight="bold" color="label">
            $3,328
          </Text>
          <Text size="13pt" weight="medium" color="labelTertiary">
            Aki Story #1004
          </Text>
        </Stack>
      </Inline>
      <Inline space="16px" alignVertical="center">
        <Stack space="10px" alignHorizontal="right">
          <Inline space="6px" alignVertical="center">
            {/* @ts-expect-error js component */}
            <CoinIcon
              address={ETH_ADDRESS}
              size={16}
              symbol={ETH_SYMBOL}
              shadowColor="transparent"
            />
            <Text size="17pt" weight="bold" color="label">
              2 WETH
            </Text>
          </Inline>
          <Inline space="3px">
            <Text size="13pt" weight="medium" color="green">
              +29.4%
            </Text>
            <Text size="13pt" weight="medium" color="labelTertiary">
              above floor
            </Text>
          </Inline>
        </Stack>
      </Inline>
    </Inline>
  );
};
