import lang from 'i18n-js';
import React from 'react';
import { neverRerender } from '@/utils';
import { Inset, Stack, Text } from '@/design-system';
import { useTheme } from '@/theme';

export const NoResults = ({ chainId }: { chainId?: number }) => {
  const { colors } = useTheme();
  return (
    <Inset horizontal={{ custom: 50 }}>
      <Stack space="16px" alignHorizontal="center">
        {/* @ts-expect-error emojis don't need text color */}
        <Text size="26pt" containsEmoji>
          👻
        </Text>
        <Stack space="12px" alignHorizontal="center">
          <Text color={{ custom: colors.dark }} size="17pt" weight="bold">
            {chainId
              ? lang.t('exchange.no_results.nothing_found')
              : lang.t('exchange.no_results.nothing_here')}
          </Text>
          {chainId && (
            <Text
              align="center"
              color={{ custom: 'rgba(60, 66, 82, 0.5)' }}
              size="15pt"
              weight="semibold"
            >
              {chainId === 1
                ? lang.t('exchange.no_results.description')
                : lang.t('exchange.no_results.description_l2')}
            </Text>
          )}
        </Stack>
      </Stack>
    </Inset>
  );
};

export default neverRerender(NoResults);
