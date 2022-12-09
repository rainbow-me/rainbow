import React from 'react';
import { Box, Stack } from '@/design-system';
import { SheetActionButton } from '@/components/sheet';
import { useTheme } from '@/theme';
import { ethereumUtils } from '@/utils';
import { Network } from '@/helpers';
import startCase from 'lodash/startCase';
import lang from 'i18n-js';

type Props = { hash?: string; network?: Network };

export const ActionButtonsSection: React.FC<Props> = ({ hash, network }) => {
  const { colors } = useTheme();

  if (!hash || !network) {
    return null;
  }

  return (
    <Box paddingVertical="12px">
      <Stack space="12px">
        <SheetActionButton
          color={colors.appleBlue}
          onPress={() => {
            ethereumUtils.openTransactionInBlockExplorer(hash, network);
          }}
          // @ts-expect-error JS component
          label={lang.t('wallet.action.view_on', {
            blockExplorerName: startCase(
              ethereumUtils.getBlockExplorer(network)
            ),
          })}
        />
      </Stack>
    </Box>
  );
};
