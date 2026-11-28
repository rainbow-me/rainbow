import React, { useEffect } from 'react';
import { type TextInput } from 'react-native';

import { runOnJS, useAnimatedRef, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { formatUnits } from 'viem';

import { useSwapsSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { SearchInput } from '@/components/token-search/SearchInput';
import { getTokenSearchButtonWrapperStyle } from '@/components/token-search/styles';
import { Box, useColorMode, useForegroundColor } from '@/design-system';
import { SWAP_ASSETS, type SwapAsset } from '@/features/solana/core/swap';
import { useSolanaInputSearchQuery } from '@/features/solana/data/solanaTokenSearchStore';
import * as i18n from '@/languages';

import { appearance } from './SolanaSwapControls';
import { SolanaSwapTokenRow } from './SolanaSwapTokenRow';
import { useSolanaSwapOptions } from './useSolanaSwapOptions';

const setOutputQuery = (text: string) => useSwapsSearchStore.setState({ searchQuery: text });
const setInputQuery = (text: string) => useSolanaInputSearchQuery.setState(text, true);

export function SolanaSwapTokenPicker({
  output,
  selected,
  balances,
  onSelect,
  onCancel,
}: {
  output: boolean;
  selected: SwapAsset | null;
  balances: Partial<Record<string, bigint>>;
  onSelect: (asset: SwapAsset) => void;
  onCancel: () => void;
}) {
  const { query, options } = useSolanaSwapOptions(output);
  const focused = useSharedValue(false);
  const listFocused = useDerivedValue(() => !focused.value);
  const hasSelection = useDerivedValue(() => !!selected);
  const { isDarkMode } = useColorMode();
  const blue = useForegroundColor('blue');
  const buttonColor = useDerivedValue(() =>
    !selected && !focused.value ? blue : appearance(selected).highContrastColor[isDarkMode ? 'dark' : 'light']
  );
  const buttonStyle = useAnimatedStyle(() => ({ color: buttonColor.value }));
  const buttonWrapperStyle = useAnimatedStyle(() =>
    getTokenSearchButtonWrapperStyle({ color: buttonColor.value, isDarkMode, pasteMode: !selected && !focused.value })
  );
  const searchRef = useAnimatedRef<TextInput>();
  const changeQuery = output ? setOutputQuery : setInputQuery;
  useEffect(() => {
    changeQuery('');
    return () => changeQuery('');
  }, [changeQuery]);
  const tokens: SwapAsset[] = [...options];
  if (!output && (!query || /^(eth|ethereum)$/i.test(query))) tokens.unshift(SWAP_ASSETS['base-eth']);
  if (!query && selected && !tokens.some(asset => asset.id === selected.id)) tokens.push(selected);
  return (
    <Box width="full">
      <SearchInput
        onSearchQueryChange={changeQuery}
        placeholder={output ? i18n.t(i18n.l.swap.find_a_token_to_buy) : i18n.t(i18n.l.swap.search_your_tokens)}
        enablePaste
        maxPasteLength={44}
        showButtonWhenNoAsset
        isSearchFocused={focused}
        isTokenListFocused={listFocused}
        isAssetSelected={hasSelection}
        searchInputRef={searchRef}
        animatedButtonStyles={{ buttonStyle, buttonWrapperStyle }}
        onSearchFocusWorklet={() => {
          'worklet';
          focused.value = true;
        }}
        onCancelOrClosePressWorklet={() => {
          'worklet';
          runOnJS(onCancel)();
        }}
      />
      {tokens.map(asset => (
        <SolanaSwapTokenRow
          key={asset.id}
          token={asset}
          output={output}
          balance={balances[asset.id] === undefined ? undefined : formatUnits(balances[asset.id] ?? 0n, asset.decimals)}
          onPress={() => onSelect(asset)}
        />
      ))}
    </Box>
  );
}
