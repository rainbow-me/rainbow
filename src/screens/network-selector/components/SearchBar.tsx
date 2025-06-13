import React, { useCallback, memo } from 'react';
import { Box, Text, useColorMode, globalColors } from '@/design-system';
import { AnimatedInput } from '@/components/AnimatedComponents/AnimatedInput';
import { networkSwitcherStore } from '@/state/networkSwitcher/networkSwitcher';
import { ButtonPressAnimation } from '@/components/animations';
import { StyleSheet, TextInput } from 'react-native';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { opacity } from '@/__swaps__/utils/swaps';
import { triggerHaptics } from 'react-native-turbo-haptics';

export const SEARCH_BAR_HEIGHT = 48;
const SEARCH_BAR_BORDER_RADIUS = SEARCH_BAR_HEIGHT / 2;

type SearchBarProps = {
  inputRef: React.RefObject<TextInput>;
  onFocus?: () => void;
  onBlur?: () => void;
};

export const SearchBar = memo(function SearchBar({ inputRef, onFocus, onBlur }: SearchBarProps) {
  const { isDarkMode } = useColorMode();
  const labelSecondary = useForegroundColor('labelSecondary');
  const searchQuery = networkSwitcherStore(state => state.searchQuery);

  const backgroundColor = isDarkMode ? 'rgba(57,58,64,1)' : globalColors.grey10;
  const borderColor = isDarkMode ? opacity('#F5F8FF', 0.06) : opacity('#9FA1A3', 0.06);

  const handleChangeText = useCallback((text: string) => {
    networkSwitcherStore.setState({ searchQuery: text });
  }, []);

  const handleClear = useCallback(() => {
    triggerHaptics('soft');
    inputRef?.current?.clear();
    networkSwitcherStore.setState({ searchQuery: '' });
  }, [inputRef]);

  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  return (
    <Box
      height={SEARCH_BAR_HEIGHT}
      borderRadius={SEARCH_BAR_BORDER_RADIUS}
      borderWidth={5 / 3}
      borderColor={{ custom: borderColor }}
      backgroundColor={backgroundColor}
      paddingHorizontal={'16px'}
      paddingVertical={'12px'}
      flexDirection="row"
      alignItems="center"
      gap={8}
      shadow={'30px'}
    >
      <Text color="labelTertiary" size="17pt" weight="semibold">
        {'􀊫'}
      </Text>
      <AnimatedInput
        ref={inputRef}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Search"
        placeholderTextColor={labelSecondary}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={'off'}
        spellCheck={false}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <ButtonPressAnimation onPress={handleClear} scaleTo={0.8}>
          <Text color="labelTertiary" size="17pt" weight="semibold">
            {'􀁡'}
          </Text>
        </ButtonPressAnimation>
      )}
    </Box>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
});
