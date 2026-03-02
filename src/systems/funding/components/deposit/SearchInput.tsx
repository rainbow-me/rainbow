import React, { useCallback } from 'react';
import { type TextInput } from 'react-native';
import { type SharedValue, useAnimatedRef, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { SearchInput as BaseSearchInput } from '@/components/token-search/SearchInput';
import { getTokenSearchButtonWrapperStyle } from '@/components/token-search/styles';
import { useColorMode } from '@/design-system';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import * as i18n from '@/languages';
import { NavigationSteps } from '../../constants';
import { useDepositContext } from '../../contexts/DepositContext';

export const SearchInput = ({ inputProgress }: { inputProgress: SharedValue<number> }) => {
  const { isDarkMode } = useColorMode();
  const searchInputRef = useAnimatedRef<TextInput>();
  const { minifiedAsset, useDepositStore } = useDepositContext();
  const isAssetSelected = useStoreSharedValue(useDepositStore, state => !!state.asset);

  const onSearchQueryChange = useUserAssetsStore(state => state.setSearchQuery);

  const onSearchFocusWorklet = useCallback(() => {
    'worklet';
    inputProgress.value = NavigationSteps.SEARCH_FOCUSED;
  }, [inputProgress]);

  const onCancelOrClosePressWorklet = useCallback(() => {
    'worklet';
    if (inputProgress.value === NavigationSteps.SEARCH_FOCUSED) {
      inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
    } else {
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
  }, [inputProgress]);

  const isSearchFocused = useDerivedValue(() => inputProgress.value === NavigationSteps.SEARCH_FOCUSED);
  const isTokenListFocused = useDerivedValue(() => inputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED);
  const searchButtonStyle = useAnimatedStyle(() => ({
    color: getColorValueForThemeWorklet(minifiedAsset.value?.highContrastColor, isDarkMode),
  }));

  const searchButtonWrapperStyle = useAnimatedStyle(() => {
    return getTokenSearchButtonWrapperStyle({
      color: getColorValueForThemeWorklet(minifiedAsset.value?.highContrastColor, isDarkMode),
      isDarkMode,
    });
  });

  return (
    <BaseSearchInput
      onCancelOrClosePressWorklet={onCancelOrClosePressWorklet}
      onSearchFocusWorklet={onSearchFocusWorklet}
      onSearchQueryChange={onSearchQueryChange}
      placeholder={i18n.t(i18n.l.swap.search_your_tokens)}
      enablePaste={false}
      showButtonWhenNoAsset={false}
      isSearchFocused={isSearchFocused}
      isTokenListFocused={isTokenListFocused}
      searchInputRef={searchInputRef}
      isAssetSelected={isAssetSelected}
      animatedButtonStyles={{ buttonStyle: searchButtonStyle, buttonWrapperStyle: searchButtonWrapperStyle }}
    />
  );
};
