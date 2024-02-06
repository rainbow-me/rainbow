import lang from 'i18n-js';
import React from 'react';
import { neverRerender } from '@/utils';
import { Inset, Stack, Text } from '@/design-system';
import { useTheme } from '@/theme';
import { logger } from '@/logger';
import { useUserAssetCount } from '@/resources/assets/useUserAssetCount';

export enum NoResultsType {
  Discover = 'discover',
  Send = 'send',
  Swap = 'swap',
}

export const NoResults = ({ onL2, type }: { onL2?: boolean; type: NoResultsType }) => {
  const { colors } = useTheme();
  const { data: assetCount } = useUserAssetCount();

  let title;
  let description;

  switch (type) {
    case NoResultsType.Discover:
      title = lang.t('exchange.no_results.nothing_here');
      break;
    case NoResultsType.Swap:
      title = lang.t('exchange.no_results.nothing_found');
      if (assetCount) {
        description = onL2 ? lang.t('exchange.no_results.description_l2') : lang.t('exchange.no_results.description');
      } else {
        description = lang.t('exchange.no_results.description_no_assets', {
          action: type,
        });
      }
      break;
    case NoResultsType.Send:
      title = lang.t('exchange.no_results.nothing_to_send');
      description = lang.t('exchange.no_results.description_no_assets', {
        action: type,
      });
      break;
    default:
      title = lang.t('exchange.no_results.nothing_found');
      logger.warn('NoResults: unknown type, falling back to default message');
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
            <Text align="center" size="15pt" weight="semibold" color="labelSecondary">
              {description}
            </Text>
          )}
        </Stack>
      </Stack>
    </Inset>
  );
};

export default neverRerender(NoResults);
