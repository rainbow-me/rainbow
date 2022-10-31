import lang from 'i18n-js';
import React from 'react';
import { neverRerender } from '@/utils';
import { Inset, Stack, Text } from '@/design-system';
import { useTheme } from '@/theme';
import { useAssetsInWallet } from '@/hooks';

export const NoResults = ({
  onL2,
  type,
}: {
  onL2?: boolean;
  type: 'discover' | 'send' | 'swap';
}) => {
  const { colors } = useTheme();
  const assets = useAssetsInWallet();

  let title;
  let description;

  switch (type) {
    case 'discover':
      title = lang.t('exchange.no_results.nothing_here');
      break;
    case 'swap':
      title = lang.t('exchange.no_results.nothing_found');
      if (assets.length) {
        description = onL2
          ? lang.t('exchange.no_results.description_l2')
          : lang.t('exchange.no_results.description');
      } else {
        description = lang.t('exchange.no_results.description_no_assets', {
          action: type,
        });
      }
      break;
    case 'send':
      title = lang.t('exchange.no_results.nothing_to_send');
      description = lang.t('exchange.no_results.description_no_assets', {
        action: type,
      });
      break;
    default:
      break;
  }

  return (
    <Inset horizontal={{ custom: 50 }}>
      <Stack space="16px" alignHorizontal="center">
        {/* @ts-expect-error emojis don't need text color */}
        <Text size="26pt" containsEmoji>
          👻
        </Text>
        <Stack space="12px" alignHorizontal="center">
          {title && (
            <Text color={{ custom: colors.dark }} size="17pt" weight="bold">
              {title}
            </Text>
          )}
          {description && (
            <Text
              align="center"
              size="15pt"
              weight="semibold"
              color="labelSecondary"
            >
              {description}
            </Text>
          )}
        </Stack>
      </Stack>
    </Inset>
  );
};

export default neverRerender(NoResults);
