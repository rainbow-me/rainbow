import lang from 'i18n-js';
import React from 'react';
import { neverRerender } from '@/utils';
import { Inset, Stack, Text } from '@/design-system';
import { useTheme } from '@/theme';
import { useAssetsInWallet } from '@/hooks';

export const NoResults = ({
  fromDiscover,
  onL2,
}: {
  fromDiscover?: boolean;
  onL2?: boolean;
}) => {
  const { colors } = useTheme();
  const assets = useAssetsInWallet();

  return (
    <Inset horizontal={{ custom: 50 }}>
      <Stack space="16px" alignHorizontal="center">
        {/* @ts-expect-error emojis don't need text color */}
        <Text size="26pt" containsEmoji>
          👻
        </Text>
        <Stack space="12px" alignHorizontal="center">
          <Text color={{ custom: colors.dark }} size="17pt" weight="bold">
            {fromDiscover
              ? lang.t('exchange.no_results.nothing_here')
              : lang.t('exchange.no_results.nothing_found')}
          </Text>
          {!fromDiscover && (
            <Text
              align="center"
              size="15pt"
              weight="semibold"
              color="labelSecondary"
            >
              {assets.length
                ? onL2
                  ? lang.t('exchange.no_results.description_l2')
                  : lang.t('exchange.no_results.description')
                : lang.t('exchange.no_results.description_no_assets')}
            </Text>
          )}
        </Stack>
      </Stack>
    </Inset>
  );
};

export default neverRerender(NoResults);
