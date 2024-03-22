import React from 'react';
import { ImgixImage } from '@/components/images';
import { Box, Inline, Stack, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';

export const SearchResult = ({ suggested }: { suggested?: boolean }) => {
  return (
    <Box as={ButtonPressAnimation} padding="8px" borderRadius={18} background={suggested ? 'fill' : undefined}>
      <Inline space="12px" alignVertical="center">
        <Box
          as={ImgixImage}
          source={{ uri: 'https://pbs.twimg.com/profile_images/1741494128779886592/RY4V0T2F_400x400.jpg' }}
          size={48}
          background="surfacePrimary"
          shadow="24px"
          width={{ custom: 40 }}
          height={{ custom: 40 }}
          borderRadius={10}
        />
        <Stack space="10px">
          <Text size="17pt" weight="bold" color="label">
            Uniswap
          </Text>
          <Text size="13pt" weight="bold" color="labelTertiary">
            app.uniswap.org
          </Text>
        </Stack>
      </Inline>
    </Box>
  );
};
