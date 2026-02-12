import React, { useCallback, useMemo } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import Animated, {
  AnimatedRef,
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue,
} from 'react-native-reanimated';
import { Input } from '@/components/inputs';
import { Bleed, Box, Column, Columns, Text, useColorMode, useForegroundColor } from '@/design-system';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/styles/constants';
import { opacity } from '@/framework/ui/utils/opacity';
import { SearchInputButton, type AnimatedButtonStyles } from './SearchInputButton';
import { TOKEN_SEARCH_CONTROL_ITEM_HEIGHT, TOKEN_SEARCH_INPUT_HORIZONTAL_PADDING } from './constants';

const AnimatedInput = Animated.createAnimatedComponent(Input);

export const SearchInput = ({
  onCancelOrClosePressWorklet,
  onSearchFocusWorklet,
  onSearchQueryChange,
  placeholder,
  enablePaste,
  showButtonWhenNoAsset,
  isSearchFocused,
  isTokenListFocused,
  searchInputRef,
  isAssetSelected,
  animatedButtonStyles,
}: {
  onCancelOrClosePressWorklet: () => void;
  onSearchFocusWorklet: () => void;
  onSearchQueryChange: (text: string) => void;
  placeholder: string;
  enablePaste: boolean;
  showButtonWhenNoAsset: boolean;
  isSearchFocused: Readonly<SharedValue<boolean>>;
  isTokenListFocused: Readonly<SharedValue<boolean>>;
  searchInputRef: AnimatedRef<TextInput>;
  isAssetSelected: Readonly<SharedValue<boolean>>;
  animatedButtonStyles: AnimatedButtonStyles;
}) => {
  const { isDarkMode } = useColorMode();
  const animatedActiveRoute = useNavigationStore(state => state.animatedActiveRoute);

  const fillTertiary = useForegroundColor('fillTertiary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');

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

  const onFocus = useCallback(() => runOnUI(onSearchFocusWorklet)(), [onSearchFocusWorklet]);

  const onCloseNetworkSelector = useCallback(() => {
    searchInputRef.current?.focus();
  }, [searchInputRef]);

  const networkSelectorRoute = Routes.NETWORK_SELECTOR;

  useAnimatedReaction(
    () => ({
      isFocused: isSearchFocused.value,
      isNetworkSelectorOpen: animatedActiveRoute.value === networkSelectorRoute,
    }),
    (current, previous) => {
      if (previous?.isFocused && !current.isFocused) {
        pastedSearchInputValue.value = '';
        runOnJS(onSearchQueryChange)('');
      }
      if (previous?.isNetworkSelectorOpen && !current.isNetworkSelectorOpen && current.isFocused) {
        runOnJS(onCloseNetworkSelector)();
      }
    },
    []
  );

  return (
    <Box paddingHorizontal={{ custom: TOKEN_SEARCH_INPUT_HORIZONTAL_PADDING }} width="full">
      <Columns alignHorizontal="justify" alignVertical="center" space="20px">
        <Box>
          <Bleed horizontal="8px" vertical="24px">
            <Box paddingHorizontal="8px" paddingVertical="20px">
              <Columns alignVertical="center" space="10px">
                <Column width="content">
                  <Box
                    alignItems="center"
                    borderRadius={TOKEN_SEARCH_CONTROL_ITEM_HEIGHT / 2}
                    height={{ custom: TOKEN_SEARCH_CONTROL_ITEM_HEIGHT }}
                    justifyContent="center"
                    style={{
                      backgroundColor: isDarkMode ? 'transparent' : opacity(fillTertiary, 0.03),
                      borderColor: isDarkMode ? SEPARATOR_COLOR : opacity(LIGHT_SEPARATOR_COLOR, 0.01),
                      borderWidth: THICK_BORDER_WIDTH,
                    }}
                    width={{ custom: TOKEN_SEARCH_CONTROL_ITEM_HEIGHT }}
                  >
                    <Text align="center" color="labelQuaternary" size="icon 17px" weight="bold">
                      􀊫
                    </Text>
                  </Box>
                </Column>
                <AnimatedInput
                  animatedProps={searchInputValue}
                  onChangeText={onSearchQueryChange}
                  onFocus={onFocus}
                  placeholder={placeholder}
                  placeholderTextColor={placeholderTextColor}
                  ref={searchInputRef}
                  spellCheck={false}
                  style={inputStyles}
                />
              </Columns>
            </Box>
          </Bleed>
        </Box>
        <Column width="content">
          <SearchInputButton
            onCancelOrClosePressWorklet={onCancelOrClosePressWorklet}
            isSearchFocused={isSearchFocused}
            isTokenListFocused={isTokenListFocused}
            enablePaste={enablePaste}
            showButtonWhenNoAsset={showButtonWhenNoAsset}
            pastedSearchInputValue={pastedSearchInputValue}
            onPasteSearchQuery={onSearchQueryChange}
            searchInputRef={searchInputRef}
            isAssetSelected={isAssetSelected}
            animatedButtonStyles={animatedButtonStyles}
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
