import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { ForwardRefRenderFunction, MutableRefObject, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Spinner from '../../assets/chartSpinner.png';
import DiscoverSheetContext from '../../screens/discover/DiscoverScreenContext';
import { ClearInputDecorator, Input } from '../inputs';
import { analytics } from '@/analytics';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { margin, Colors } from '@/styles';
import { deviceUtils } from '@/utils';
import ShadowStack from '@/react-native-shadow-stack';
import { TextInput } from 'react-native';
import { useTheme } from '@/theme';
import { Box, Text } from '@/design-system';
import { Source } from 'react-native-fast-image';
import { IS_TEST } from '@/env';
import { ChainId } from '@rainbow-me/swaps';

export const ExchangeSearchHeight = 40;
const DoneButtonWidth = 52;
const ExchangeSearchWidth = deviceUtils.dimensions.width - 40;

const ShadowContainer = styled(ShadowStack)(() => ({
  ...margin.object(0, 20, 20, 20),
}));

const BackgroundGradient = styled(LinearGradient).attrs(({ theme: { colors } }: { theme: { colors: Colors } }) => ({
  colors: colors.gradients.offWhite,
  end: { x: 0.5, y: 1 },
  start: { x: 0.5, y: 0 },
}))({
  borderRadius: ExchangeSearchHeight / 2,
  height: ExchangeSearchWidth,
  left: 0,
  overflow: 'hidden',
  position: 'absolute',
  top: -(ExchangeSearchWidth - ExchangeSearchHeight) / 2,
  transform: [{ scaleY: ExchangeSearchHeight / ExchangeSearchWidth }],
  width: ExchangeSearchWidth,
});

const SearchInput = styled(Input).attrs(
  ({
    theme: { colors },
    isSearchModeEnabled,
    clearTextOnFocus,
  }: {
    theme: { colors: Colors };
    isSearchModeEnabled: boolean;
    clearTextOnFocus: boolean;
  }) => ({
    blurOnSubmit: false,
    clearTextOnFocus,
    color: colors.alpha(colors.blueGreyDark, 0.8),
    enablesReturnKeyAutomatically: true,
    keyboardAppearance: 'dark',
    keyboardType: 'ascii-capable',
    lineHeight: 'looserLoose',
    placeholderTextColor: colors.alpha(colors.blueGreyDark, 0.6),
    returnKeyType: 'search',
    selectionColor: isSearchModeEnabled ? colors.appleBlue : colors.transparent,
    size: 'large',
    spellCheck: false,
    weight: 'semibold',
  })
)({
  ...(android ? { marginBottom: -10, marginTop: -6 } : {}),
  flex: 1,
  height: ios ? 39 : 56,
  marginBottom: 1,
  marginLeft: ({ isSearchModeEnabled }: { isSearchModeEnabled: boolean }) => (isSearchModeEnabled ? 4 : 0),
  textAlign: ({ isSearchModeEnabled }: { isSearchModeEnabled: boolean }) => (isSearchModeEnabled ? 'left' : 'center'),
});

const rotationConfig = {
  duration: 500,
  easing: Easing.linear,
};

const timingConfig = {
  duration: 300,
};

const ExchangeSearchShadowsFactory = (c: Colors) => [
  [0, 7, 21, c.shadow, 0.15],
  [0, 3.5, 10.5, c.shadow, 0.04],
];

interface ExchangeSearchProps {
  isDiscover?: boolean;
  isFetching: boolean;
  isSearching: boolean;
  onChangeText: (arg: string) => void;
  onFocus: ({ target }: any) => void;
  searchQuery: string;
  testID: string;
  placeholderText?: string;
  clearTextOnFocus: boolean;
}

const ExchangeSearch: ForwardRefRenderFunction<TextInput, ExchangeSearchProps> = (
  {
    isDiscover,
    isFetching,
    isSearching,
    onChangeText,
    onFocus,
    searchQuery,
    testID,
    placeholderText = lang.t('button.exchange_search_placeholder'),
    clearTextOnFocus = true,
  },
  ref
) => {
  const inputRef = ref as MutableRefObject<TextInput>;
  const handleClearInput = useCallback(() => {
    if (isDiscover && searchQuery.length > 1) {
      analytics.track('Search Query', {
        category: 'discover',
        length: searchQuery.length,
        query: searchQuery,
      });
    }
    inputRef?.current?.clear();
    onChangeText?.('');
  }, [isDiscover, searchQuery, inputRef, onChangeText]);

  const ExchangeSearchWidthFocused = isDiscover ? ExchangeSearchWidth - DoneButtonWidth : ExchangeSearchWidth;

  const spinnerRotation = useSharedValue(0);
  const spinnerScale = useSharedValue(0);
  const { isSearchModeEnabled = true } = useContext(DiscoverSheetContext) ?? {
    isSearchModeEnabled: true,
  };

  const spinnerTimeout = useRef<NodeJS.Timeout>();
  const { colors } = useTheme();
  const shadows = useMemo(() => ExchangeSearchShadowsFactory(colors), [colors]);

  useEffect(() => {
    if ((isFetching || isSearching) && !isEmpty(searchQuery)) {
      clearTimeout(spinnerTimeout.current as NodeJS.Timeout);
      spinnerRotation.value = 0;
      spinnerRotation.value = withRepeat(withTiming(360, rotationConfig), -1, false);
      spinnerScale.value = withTiming(1, timingConfig);
    } else {
      spinnerScale.value = withTiming(0, timingConfig);
      spinnerTimeout.current = setTimeout(() => (spinnerRotation.value = 0), timingConfig.duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetching, isSearching, searchQuery]);

  const searchIconStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - spinnerScale.value,
      transform: [{ scale: 1 - spinnerScale.value }],
    };
  });

  const spinnerStyle = useAnimatedStyle(() => {
    return {
      opacity: spinnerScale.value,
      transform: [{ rotate: `${spinnerRotation.value}deg` }, { scale: spinnerScale.value }],
    };
  });

  return (
    <ShadowContainer
      backgroundColor={colors.white}
      borderRadius={ExchangeSearchHeight / 2}
      height={ExchangeSearchHeight}
      shadows={shadows}
      width={isSearchModeEnabled ? ExchangeSearchWidthFocused : ExchangeSearchWidth}
    >
      <Box
        flexDirection="row"
        borderRadius={ExchangeSearchHeight / 2}
        height={{ custom: ExchangeSearchHeight }}
        paddingLeft={isSearchModeEnabled ? '12px' : undefined}
        paddingRight={isSearchModeEnabled ? '36px' : undefined}
      >
        <BackgroundGradient />

        {isSearchModeEnabled && !IS_TEST && (
          <>
            <Box as={Animated.View} paddingTop={{ custom: 14 }} style={searchIconStyle}>
              <Text weight="semibold" size="17pt" color={{ custom: colors.alpha(colors.blueGreyDark, 0.6) }}>
                􀊫
              </Text>
            </Box>

            <Box
              as={Animated.View}
              height={{ custom: 20 }}
              width={{ custom: 20 }}
              position="absolute"
              left={{ custom: 12 }}
              top={{ custom: 10 }}
              style={spinnerStyle}
            >
              <ImgixImage
                resizeMode={ImgixImage.resizeMode.contain}
                source={Spinner as Source}
                tintColor={colors.alpha(colors.blueGreyDark, 0.6)}
                style={{ height: 20, width: 20 }}
                size={20}
              />
            </Box>
          </>
        )}
        <SearchInput
          clearTextOnFocus={clearTextOnFocus}
          isSearchModeEnabled={isSearchModeEnabled}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholderText}
          ref={inputRef}
          testID={testID + '-input'}
          value={searchQuery}
        />
        <ClearInputDecorator
          inputHeight={ExchangeSearchHeight}
          isVisible={searchQuery !== ''}
          onPress={handleClearInput}
          testID={testID + '-clear-input'}
        />
      </Box>
    </ShadowContainer>
  );
};

export default React.forwardRef(ExchangeSearch);
