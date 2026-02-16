import React from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import { SearchInput as BaseSearchInput } from '@/components/token-search/SearchInput';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { useSwapsSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import * as i18n from '@/languages';

const FIND_A_TOKEN_TO_BUY_LABEL = i18n.t(i18n.l.swap.find_a_token_to_buy);
const SEARCH_YOUR_TOKENS_LABEL = i18n.t(i18n.l.swap.search_your_tokens);

const onOutputSearchQueryChange = (text: string) => useSwapsSearchStore.setState({ searchQuery: text });

export const SearchInput = ({
  onCancelOrClosePressWorklet,
  onSearchFocusWorklet,
  output,
}: {
  onCancelOrClosePressWorklet: () => void;
  onSearchFocusWorklet: () => void;
  output: boolean;
}) => {
  const {
    inputProgress,
    inputSearchRef,
    outputProgress,
    outputSearchRef,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    AnimatedSwapStyles,
  } = useSwapContext();

  const onInputSearchQueryChange = useUserAssetsStore(state => state.setSearchQuery);

  const progress = output ? outputProgress : inputProgress;
  const isSearchFocused = useDerivedValue(() => progress.value === NavigationSteps.SEARCH_FOCUSED);
  const isTokenListFocused = useDerivedValue(() => progress.value === NavigationSteps.TOKEN_LIST_FOCUSED);
  const isAssetSelected = useDerivedValue(() => !!(output ? internalSelectedOutputAsset.value : internalSelectedInputAsset.value));

  return (
    <BaseSearchInput
      onCancelOrClosePressWorklet={onCancelOrClosePressWorklet}
      onSearchFocusWorklet={onSearchFocusWorklet}
      onSearchQueryChange={output ? onOutputSearchQueryChange : onInputSearchQueryChange}
      placeholder={output ? FIND_A_TOKEN_TO_BUY_LABEL : SEARCH_YOUR_TOKENS_LABEL}
      enablePaste={output}
      showButtonWhenNoAsset={output}
      isSearchFocused={isSearchFocused}
      isTokenListFocused={isTokenListFocused}
      searchInputRef={output ? outputSearchRef : inputSearchRef}
      isAssetSelected={isAssetSelected}
      animatedButtonStyles={{
        buttonWrapperStyle: output
          ? AnimatedSwapStyles.searchOutputAssetButtonWrapperStyle
          : AnimatedSwapStyles.searchInputAssetButtonWrapperStyle,
        buttonStyle: output ? AnimatedSwapStyles.searchOutputAssetButtonStyle : AnimatedSwapStyles.searchInputAssetButtonStyle,
      }}
    />
  );
};
