import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { Input } from '@/components/inputs';
import { Bleed, Box, Column, Columns, Text, useColorMode, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { INPUT_PADDING, LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { opacity } from '@/__swaps__/utils/swaps';
import { useSwapsSearchStore } from '../resources/search/searchV2';
import { SearchInputButton } from './SearchInputButton';

const AnimatedInput = Animated.createAnimatedComponent(Input);

const FIND_A_TOKEN_TO_BUY_LABEL = i18n.t(i18n.l.swap.find_a_token_to_buy);
const SEARCH_YOUR_TOKENS_LABEL = i18n.t(i18n.l.swap.search_your_tokens);

const onOutputSearchQueryChange = (text: string) => useSwapsSearchStore.setState({ searchQuery: text });

export const SearchInput = ({
  handleExitSearchWorklet,
  handleFocusSearchWorklet,
  output,
}: {
  handleExitSearchWorklet: () => void;
  handleFocusSearchWorklet: () => void;
  output: boolean;
}) => {
  const { isDarkMode } = useColorMode();
  const { inputProgress, inputSearchRef, outputProgress, outputSearchRef } = useSwapContext();
  const animatedActiveRoute = useNavigationStore(state => state.animatedActiveRoute);

  const fillTertiary = useForegroundColor('fillTertiary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const onInputSearchQueryChange = useUserAssetsStore(state => state.setSearchQuery);

  const isSearchFocused = useDerivedValue(
    () =>
      (!output && inputProgress.value === NavigationSteps.SEARCH_FOCUSED) ||
      (output && outputProgress.value === NavigationSteps.SEARCH_FOCUSED)
  );

  const pastedSearchInputValue = useSharedValue('');
  const searchInputValue = useAnimatedProps(() => {
    // Removing the value when the input is focused allows the input to be reset to the correct value on blur
    const query = isSearchFocused.value ? undefined : '';
    return {
      text: pastedSearchInputValue.value || query,
      defaultValue: '',
    };
  });

  const { inputStyles, placeholderTextColor } = useMemo(
    () => ({
      inputStyles: [styles.animatedInput, { color: label }],
      placeholderTextColor: isDarkMode ? opacity(labelQuaternary, 0.3) : labelQuaternary,
    }),
    [isDarkMode, label, labelQuaternary]
  );

  const onFocus = useCallback(() => runOnUI(handleFocusSearchWorklet)(), [handleFocusSearchWorklet]);

  const onCloseNetworkSelector = useCallback(() => {
    if (output) outputSearchRef.current?.focus();
    else inputSearchRef.current?.focus();
  }, [inputSearchRef, output, outputSearchRef]);

  const networkSelectorRoute = Routes.NETWORK_SELECTOR;

  useAnimatedReaction(
    () => ({
      isFocused: isSearchFocused.value,
      isNetworkSelectorOpen: animatedActiveRoute.value === networkSelectorRoute,
    }),
    (current, previous) => {
      if (previous?.isFocused && !current.isFocused) {
        pastedSearchInputValue.value = '';
        if (output) runOnJS(onOutputSearchQueryChange)('');
        else runOnJS(onInputSearchQueryChange)('');
      }
      if (previous?.isNetworkSelectorOpen && !current.isNetworkSelectorOpen && current.isFocused) {
        runOnJS(onCloseNetworkSelector)();
      }
    },
    []
  );

  return (
    <Box paddingHorizontal={{ custom: INPUT_PADDING }} width="full">
      <Columns alignHorizontal="justify" alignVertical="center" space="20px">
        <Box>
          <Bleed horizontal="8px" vertical="24px">
            <Box paddingHorizontal="8px" paddingVertical="20px">
              <Columns alignVertical="center" space="10px">
                <Column width="content">
                  <Box
                    alignItems="center"
                    borderRadius={18}
                    height={{ custom: 36 }}
                    justifyContent="center"
                    style={{
                      backgroundColor: isDarkMode ? 'transparent' : opacity(fillTertiary, 0.03),
                      borderColor: isDarkMode ? SEPARATOR_COLOR : opacity(LIGHT_SEPARATOR_COLOR, 0.01),
                      borderWidth: THICK_BORDER_WIDTH,
                    }}
                    width={{ custom: 36 }}
                  >
                    <Text align="center" color="labelQuaternary" size="icon 17px" weight="bold">
                      􀊫
                    </Text>
                  </Box>
                </Column>
                <AnimatedInput
                  animatedProps={searchInputValue}
                  onChangeText={output ? onOutputSearchQueryChange : onInputSearchQueryChange}
                  onFocus={onFocus}
                  placeholder={output ? FIND_A_TOKEN_TO_BUY_LABEL : SEARCH_YOUR_TOKENS_LABEL}
                  placeholderTextColor={placeholderTextColor}
                  ref={output ? outputSearchRef : inputSearchRef}
                  spellCheck={false}
                  style={inputStyles}
                />
              </Columns>
            </Box>
          </Bleed>
        </Box>
        <Column width="content">
          <SearchInputButton
            handleExitSearchWorklet={handleExitSearchWorklet}
            isSearchFocused={isSearchFocused}
            output={output}
            pastedSearchInputValue={pastedSearchInputValue}
          />
        </Column>
      </Columns>
    </Box>
  );
};

const styles = StyleSheet.create({
  animatedInput: {
    fontSize: 17,
    fontWeight: 'bold',
    height: 44,
    zIndex: 10,
  },
});
