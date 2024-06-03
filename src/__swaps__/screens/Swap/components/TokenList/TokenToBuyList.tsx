import { StyleSheet } from 'react-native';
import React from 'react';
import { TokenToBuySection } from '@/__swaps__/screens/Swap/components/TokenList/TokenToBuySection';
import { Stack } from '@/design-system';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { ChainSelection } from './ChainSelection';
import { useSearchCurrencyLists } from '../../hooks/useSearchCurrencyLists';

export const TokenToBuyList = () => {
  const { loading, results: sections } = useSearchCurrencyLists();

  return (
    <Stack space="32px">
      <ChainSelection output />
      {sections
        .filter(section => section.data.length)
        .map(section => (
          <Stack key={section.id} space="20px">
            <TokenToBuySection section={section} />
          </Stack>
        ))}

      {!sections.length && !loading && <ListEmpty isSearchEmptyState output />}
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
