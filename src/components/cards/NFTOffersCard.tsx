import {
  Bleed,
  Box,
  Inline,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import React from 'react';
import { ButtonPressAnimation, ShimmerAnimation } from '../animations';
import { useDimensions } from '@/hooks';

export const NFTOffersCard = () => {
  const NUM_OFFERS = 65;
  const TOTAL_VALUE_USD = '$42.4k';
  const borderColor = useForegroundColor('separator');
  const buttonColor = useForegroundColor('fillSecondary');
  const { width: deviceWidth } = useDimensions();
  return (
    <Box width="full">
      <Stack space="20px">
        <Inline alignVertical="center" alignHorizontal="justify">
          <Inline alignVertical="center" space={{ custom: 7 }}>
            <Text weight="heavy" size="20pt">{`${NUM_OFFERS} Offers`}</Text>
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
                {TOTAL_VALUE_USD}
              </Text>
            </Box>
          </Inline>
          <ButtonPressAnimation>
            <Inline alignVertical="center">
              <Text size="15pt" weight="bold" color="labelTertiary">
                􀑁
              </Text>
              <Text size="17pt" weight="bold">
                {' Highest '}
              </Text>
              <Text size="15pt" weight="bold">
                􀆈
              </Text>
            </Inline>
          </ButtonPressAnimation>
        </Inline>
        <Bleed horizontal="20px">
          <Box background="blue" height={{ custom: 117.75 }} width="full" />
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
