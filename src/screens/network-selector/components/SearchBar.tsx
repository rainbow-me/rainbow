import React, { useCallback } from 'react';
import { Box, Text, useColorMode, globalColors } from '@/design-system';
import { AnimatedInput } from '@/components/AnimatedComponents/AnimatedInput';
import { networkSwitcherStore } from '@/state/networkSwitcher/networkSwitcher';
import { ButtonPressAnimation } from '@/components/animations';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { opacity } from '@/__swaps__/utils/swaps';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { BlurView } from 'react-native-blur-view';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

const SEARCH_BAR_HEIGHT = 48;
const SEARCH_BAR_BORDER_RADIUS = SEARCH_BAR_HEIGHT / 2;

type SearchBarProps = {
  onFocus?: () => void;
  onBlur?: () => void;
};

export const SearchBar = React.memo(function SearchBar({ onFocus, onBlur }: SearchBarProps) {
  const { isDarkMode } = useColorMode();
  const labelSecondary = useForegroundColor('labelSecondary');
  const searchQuery = networkSwitcherStore(state => state.searchQuery);

  // const backgroundColor = isDarkMode ? globalColors.white10 : globalColors.grey20;
  const backgroundColor = 'rgba(57,58,64,0.7)';
  const borderColor = isDarkMode ? opacity('#F5F8FF', 0.06) : opacity('#9FA1A3', 0.06);

  const handleChangeText = useCallback((text: string) => {
    networkSwitcherStore.setState({ searchQuery: text });
  }, []);

  const handleClear = useCallback(() => {
    triggerHaptics('soft');
    networkSwitcherStore.setState({ searchQuery: '' });
  }, []);

  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  return (
    <Box>
      {/* <BlurView blurStyle={isDarkMode ? 'dark' : 'light'} blurIntensity={30} style={styles.blurViewStyle} /> */}
      <Box
        height={SEARCH_BAR_HEIGHT}
        borderRadius={SEARCH_BAR_BORDER_RADIUS}
        borderWidth={5 / 3}
        borderColor={{ custom: borderColor }}
        backgroundColor={backgroundColor}
        shadow={'30px'}
      >
        <Box
          width={'full'}
          height={'full'}
          paddingHorizontal={'16px'}
          paddingVertical={'12px'}
          flexDirection="row"
          alignItems="center"
          gap={8}
          backgroundColor={backgroundColor}
          shadow={'12px'}
        >
          <Text color="labelTertiary" size="17pt" weight="semibold">
            {'􀊫'}
          </Text>
          <AnimatedInput
            value={searchQuery}
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
            <View>
              <ButtonPressAnimation onPress={handleClear} scaleTo={0.8}>
                <Text color="labelTertiary" size="17pt" weight="semibold">
                  {'􀁡'}
                </Text>
              </ButtonPressAnimation>
            </View>
          )}
        </Box>
      </Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  blurViewStyle: {
    borderCurve: 'continuous',
    borderRadius: SEARCH_BAR_BORDER_RADIUS,
    height: SEARCH_BAR_HEIGHT,
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
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
