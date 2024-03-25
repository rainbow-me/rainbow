import React from 'react';
import { TextInput } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import { Input } from '@/components/inputs';
import { Bleed, Box, Column, Columns, Text, useColorMode, useForegroundColor } from '@/design-system';
import { ETH_COLOR, ETH_COLOR_DARK, LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '../constants';
import { opacity } from '../utils/swaps';
import { useSwapAssetStore } from '../state/assets';

export const SearchInput = ({
  color,
  handleExitSearch,
  handleFocusSearch,
  isFocused,
  output,
  setIsFocused,
}: {
  color: string;
  handleExitSearch: () => void;
  handleFocusSearch: () => void;
  isFocused?: boolean;
  output?: boolean;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isDarkMode } = useColorMode();
  const { assetToBuy, assetToSell } = useSwapAssetStore();

  const topColor = (assetToSell?.colors?.primary || assetToSell?.colors?.fallback) ?? (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);
  const bottomColor = (assetToBuy?.colors?.primary || assetToBuy?.colors?.fallback) ?? (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);

  const { searchFilter, setSearchFilter } = useSwapAssetStore();

  const inputRef = React.useRef<TextInput>(null);

  const fillTertiary = useForegroundColor('fillTertiary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');

  return (
    <Box width="full">
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
                <Input
                  onBlur={() => {
                    handleExitSearch();
                    setSearchFilter('');
                    setIsFocused(false);
                  }}
                  onChangeText={setSearchFilter}
                  onFocus={() => {
                    handleFocusSearch();
                    setIsFocused(true);
                  }}
                  placeholder={output ? 'Find a token to buy' : 'Search your tokens'}
                  placeholderTextColor={isDarkMode ? opacity(labelQuaternary, 0.3) : labelQuaternary}
                  ref={inputRef}
                  selectionColor={color}
                  spellCheck={false}
                  style={{
                    color: label,
                    fontSize: 17,
                    fontWeight: 'bold',
                    height: 44,
                    zIndex: 10,
                  }}
                  value={searchFilter}
                />
              </Columns>
            </Box>
          </Bleed>
        </Box>
        <Column width="content">
          <ButtonPressAnimation
            onPress={() => {
              if (!isFocused) {
                handleExitSearch();
              } else {
                inputRef.current?.blur();
                setIsFocused(false);
              }
            }}
            scaleTo={0.8}
          >
            <Box
              alignItems="center"
              borderRadius={18}
              height={{ custom: 36 }}
              justifyContent="center"
              paddingHorizontal={{ custom: 12 - THICK_BORDER_WIDTH }}
              style={{
                backgroundColor: opacity(output ? bottomColor : topColor, isDarkMode ? 0.1 : 0.08),
                borderColor: opacity(output ? bottomColor : topColor, isDarkMode ? 0.06 : 0.01),
                borderWidth: THICK_BORDER_WIDTH,
              }}
            >
              <Text align="center" color={{ custom: output ? bottomColor : topColor }} size="17pt" weight="heavy">
                {isFocused ? 'Cancel' : 'Close'}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Column>
      </Columns>
    </Box>
  );
};
