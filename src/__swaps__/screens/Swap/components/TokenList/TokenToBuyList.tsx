import * as i18n from '@/languages';
import React, { useMemo } from 'react';
import { useAssetsToBuySections } from '../../hooks/useAssetsToBuy';
import { TokenToBuySection } from './TokenToBuySection';
import { Box, Stack, Text } from '@/design-system';
import { useSwapAssetStore } from '../../state/assets';
import { isL2Chain } from '../../utils/chains';

export const TokenToBuyList = () => {
  const { outputChainId } = useSwapAssetStore();
  const sections = useAssetsToBuySections();

  const isL2 = useMemo(() => outputChainId && isL2Chain(outputChainId), [outputChainId]);

  const assetsCount = useMemo(() => sections?.reduce((count, section) => count + section.data.length, 0), [sections]);

  return (
    <Stack space="20px">
      {sections.map(section => (
        <TokenToBuySection key={section.id} section={section} />
      ))}

      {!assetsCount && (
        <Box alignItems="center" style={{ paddingTop: 91 }}>
          <Box paddingHorizontal="44px">
            <Stack space="16px">
              <Text color="label" size="26pt" weight="bold" align="center">
                {'👻'}
              </Text>

              <Text color="labelTertiary" size="20pt" weight="semibold" align="center">
                {i18n.t(i18n.l.swap.tokens_input.nothing_found)}
              </Text>

              <Text color="labelQuaternary" size="14px / 19px (Deprecated)" weight="regular" align="center">
                {i18n.t(i18n.l.swap.tokens_input[isL2 ? 'nothing_found_description_l2' : 'nothing_found_description'], {
                  action: 'swap',
                })}
              </Text>
            </Stack>
          </Box>
        </Box>
      )}
    </Stack>
  );
};
