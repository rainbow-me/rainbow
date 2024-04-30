import { StyleSheet } from 'react-native';
import React, { useMemo } from 'react';

import { useAssetsToBuySections } from '@/__swaps__/screens/Swap/hooks/useAssetsToBuy';
import { TokenToBuySection } from '@/__swaps__/screens/Swap/components/TokenList/TokenToBuySection';
import { Stack } from '@/design-system';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { ChainSelection } from './ChainSelection';

export const TokenToBuyList = () => {
  const { sections, loading } = useAssetsToBuySections();
  const assetsCount = useMemo(() => sections?.reduce((count, section) => count + section.data.length, 0), [sections]);

  console.log('rendering token buy list', loading);

  return (
    <Stack space="32px">
      <ChainSelection output />
      {!loading && (
        <Stack space="20px">
          {sections
            .filter(section => section.data.length)
            .map(section => (
              <TokenToBuySection key={section.id} section={section} />
            ))}
        </Stack>
      )}

      {!assetsCount && <ListEmpty output />}
    </Stack>
  );
};

export const styles = StyleSheet.create({
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
