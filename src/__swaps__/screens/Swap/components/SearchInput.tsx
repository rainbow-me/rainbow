import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { opacity } from '@/__swaps__/utils/swaps';
import { Input } from '@/components/inputs';
import { Bleed, Box, Column, Columns, Text, useColorMode, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import React from 'react';
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { SearchInputButton } from './SearchInputButton';

const AnimatedInput = Animated.createAnimatedComponent(Input);

const FIND_A_TOKEN_TO_BUY_LABEL = i18n.t(i18n.l.swap.find_a_token_to_buy);
const SEARCH_YOUR_TOKENS_LABEL = i18n.t(i18n.l.swap.search_your_tokens);

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

  const fillTertiary = useForegroundColor('fillTertiary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const onInputSearchQueryChange = userAssetsStore(state => state.setSearchQuery);

  const onOutputSearchQueryChange = useDebouncedCallback((text: string) => useSwapsStore.setState({ outputSearchQuery: text }), 100, {
    leading: false,
    trailing: true,
  });

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

  useAnimatedReaction(
    () => isSearchFocused.value,
    (focused, prevFocused) => {
      if (focused === false && prevFocused === true) {
        pastedSearchInputValue.value = '';
        if (output) runOnJS(onOutputSearchQueryChange)('');
        else runOnJS(onInputSearchQueryChange)('');
      }
    }
  );

  return (
    <Box paddingHorizontal="20px" width="full">
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
                  onBlur={() => {
                    runOnUI(() => {
                      if (isSearchFocused.value) {
                        handleExitSearchWorklet();
                      }
                    })();

                    if (isSearchFocused.value) {
                      if (output) {
                        if (useSwapsStore.getState().outputSearchQuery !== '') {
                          useSwapsStore.setState({ outputSearchQuery: '' });
                        }
                      } else {
                        if (userAssetsStore.getState().inputSearchQuery !== '') {
                          userAssetsStore.getState().setSearchQuery('');
                        }
                      }
                    }
                  }}
                  onFocus={() => runOnUI(handleFocusSearchWorklet)()}
                  placeholder={output ? FIND_A_TOKEN_TO_BUY_LABEL : SEARCH_YOUR_TOKENS_LABEL}
                  placeholderTextColor={isDarkMode ? opacity(labelQuaternary, 0.3) : labelQuaternary}
                  selectTextOnFocus
                  ref={output ? outputSearchRef : inputSearchRef}
                  spellCheck={false}
                  style={{
                    color: label,
                    fontSize: 17,
                    fontWeight: 'bold',
                    height: 44,
                    zIndex: 10,
                  }}
                />
              </Columns>
            </Box>
          </Bleed>
        </Box>
        <Column width="content">
          <SearchInputButton
            output={output}
            pastedSearchInputValue={pastedSearchInputValue}
            isSearchFocused={isSearchFocused}
            handleExitSearchWorklet={handleExitSearchWorklet}
          />
        </Column>
      </Columns>
    </Box>
  );
};
