import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, TextInput, View, NativeSyntheticEvent, TextInputChangeEventData } from 'react-native';
import { Box, globalColors, Text, useColorMode } from '@/design-system';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { PolymarketNavigation } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { AnimatedInput } from '@/components/AnimatedComponents/AnimatedInput';
import { polymarketEventSearchActions } from '@/features/polymarket/stores/polymarketEventSearchStore';
import { typeHierarchy } from '@/design-system/typography/typeHierarchy';
import { fontWithWidth } from '@/styles/buildTextStyles';
import font from '@/styles/fonts';
import { BlurView } from 'react-native-blur-view';
import LinearGradient from 'react-native-linear-gradient';
import { THICK_BORDER_WIDTH, THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { time } from '@/utils/time';
import { useDebouncedCallback } from 'use-debounce';
import * as i18n from '@/languages';
import { POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { IS_IOS } from '@/env';

const SEARCH_BAR_HEIGHT = 52;

export const PolymarketSearchFooter = memo(function PolymarketSearchFooter() {
  const { isDarkMode } = useColorMode();
  const inputRef = useRef<TextInput>(null);

  const textAccentColor = '#C863E8';
  const accentColors = useMemo(() => {
    const color = isDarkMode ? '#DC91F4' : '#E650D5';
    return {
      opacity3: opacityWorklet(color, 0.03),
      opacity6: opacityWorklet(color, 0.06),
      opacity12: opacityWorklet(color, 0.12),
      opacity40: opacityWorklet(color, 0.4),
      opacity50: opacityWorklet(color, 0.5),
      opacity100: color,
    };
  }, [isDarkMode]);

  const debouncedSetSearchQuery = useDebouncedCallback(
    (query: string) => {
      polymarketEventSearchActions.setSearchQuery(query);
    },
    time.ms(500),
    { leading: false, trailing: true }
  );

  const onSearchQueryChange = useCallback(
    (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
      debouncedSetSearchQuery(event.nativeEvent.text);
    },
    [debouncedSetSearchQuery]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, time.ms(200));
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    return () => polymarketEventSearchActions.setSearchQuery('');
  }, []);

  const lightShadowProps = !isDarkMode ? { backgroundColor: POLYMARKET_BACKGROUND_LIGHT, shadow: '24px' as const } : {};

  return (
    <View style={styles.container}>
      <ButtonPressAnimation onPress={() => PolymarketNavigation.goBack()}>
        <Box
          borderRadius={64}
          height={SEARCH_BAR_HEIGHT}
          width={SEARCH_BAR_HEIGHT}
          justifyContent="center"
          alignItems="center"
          borderWidth={isDarkMode ? THICKER_BORDER_WIDTH : THICK_BORDER_WIDTH}
          borderColor={{ custom: isDarkMode ? accentColors.opacity6 : globalColors.white100 }}
          backgroundColor={accentColors.opacity12}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...lightShadowProps}
        >
          {isDarkMode && (
            <>
              <BlurView blurIntensity={24} blurStyle={'dark'} style={StyleSheet.absoluteFill} />
              <LinearGradient
                style={[StyleSheet.absoluteFill, { opacity: 0.07 }]}
                colors={[accentColors.opacity100, accentColors.opacity50]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </>
          )}
          <Text size="20pt" weight="black" color={{ custom: textAccentColor }}>
            {'􀯶'}
          </Text>
        </Box>
      </ButtonPressAnimation>

      <View style={styles.flex}>
        <Box
          height={SEARCH_BAR_HEIGHT}
          borderRadius={64}
          style={styles.searchInputContainer}
          borderWidth={isDarkMode ? THICKER_BORDER_WIDTH : THICK_BORDER_WIDTH}
          borderColor={{ custom: isDarkMode ? accentColors.opacity3 : globalColors.white100 }}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...lightShadowProps}
        >
          {isDarkMode && (
            <>
              {IS_IOS ? (
                <>
                  <BlurView blurIntensity={24} blurStyle={'dark'} style={StyleSheet.absoluteFill} />
                  <LinearGradient
                    style={[StyleSheet.absoluteFill, { opacity: 0.07 }]}
                    colors={[accentColors.opacity100, accentColors.opacity50]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                </>
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#190F1C' }]} />
              )}
            </>
          )}
          <Text size="17pt" weight="heavy" color={{ custom: textAccentColor }}>
            {'􀊫'}
          </Text>
          <AnimatedInput
            clearButtonMode="while-editing"
            enablesReturnKeyAutomatically
            onChange={onSearchQueryChange}
            placeholder={i18n.t(i18n.l.predictions.search.input_placeholder)}
            placeholderTextColor={opacityWorklet(textAccentColor, 0.4)}
            ref={inputRef}
            returnKeyType="search"
            spellCheck={false}
            selectionColor={textAccentColor}
            style={[styles.input, { color: isDarkMode ? globalColors.white100 : globalColors.grey100 }]}
            textAlign="left"
            textAlignVertical="center"
          />
        </Box>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 20,
    height: SEARCH_BAR_HEIGHT,
    letterSpacing: typeHierarchy['text']['20pt'].letterSpacing,
    paddingLeft: 10,
    paddingRight: 9,
    paddingVertical: 10,
    includeFontPadding: false,
    ...fontWithWidth(font.weight.semibold),
  },
  flex: {
    flex: 1,
  },
});
