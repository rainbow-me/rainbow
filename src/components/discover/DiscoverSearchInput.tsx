import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Spinner from '../../assets/chartSpinner.png';
import { ClearInputDecorator, Input } from '../inputs';
import { Row } from '../layout';
import { Text } from '../text';
import { analytics } from '@/analytics';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { margin, padding } from '@/styles';
import { deviceUtils } from '@/utils';
import { chainsName } from '@/chains';
import { ThemeContextProps } from '@/theme';
import { ChainId } from '@/chains/types';
import { TextInput } from 'react-native';

export const ExchangeSearchHeight = 40;
const ExchangeSearchWidth = deviceUtils.dimensions.width - 30;

type ContainerProps = {
  isSearching: boolean;
  isLoading: boolean;
  isDiscover: boolean;
  clearTextOnFocus: boolean;
  theme: ThemeContextProps;
};

const Container = styled(Row)(({ isSearching, theme: { colors } }: ContainerProps) => ({
  ...margin.object(0, 15, isSearching ? 8 : 0),
  ...(isSearching ? padding.object(0, 37, 0, 12) : padding.object(0)),
  backgroundColor: colors.transparent,
  borderRadius: ExchangeSearchHeight / 2,
  height: ExchangeSearchHeight,
  overflow: 'hidden',
}));

const BackgroundGradient = styled(RadialGradient).attrs(({ isDiscover, theme: { colors } }: ContainerProps) => ({
  center: [ExchangeSearchWidth, ExchangeSearchWidth / 2],
  colors: isDiscover ? colors.gradients.searchBar : colors.gradients.lightGreyTransparent,
}))({
  height: ExchangeSearchWidth,
  position: 'absolute',
  top: -(ExchangeSearchWidth - ExchangeSearchHeight) / 2,
  transform: [{ scaleY: ExchangeSearchHeight / ExchangeSearchWidth }],
  width: ExchangeSearchWidth,
});

const SearchIcon = styled(Text).attrs(({ theme: { colors } }: ContainerProps) => ({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  size: 'large',
  weight: 'semibold',
}))({});

const SearchIconWrapper = styled(Animated.View)({
  marginTop: android ? 4 : 9,
});

const SearchInput = styled(Input).attrs(({ theme: { colors }, isSearching, clearTextOnFocus }: ContainerProps) => ({
  blurOnSubmit: false,
  clearTextOnFocus,
  color: colors.alpha(colors.blueGreyDark, 0.8),
  enablesReturnKeyAutomatically: true,
  keyboardAppearance: 'dark',
  keyboardType: 'ascii-capable',
  lineHeight: 'looserLoose',
  placeholderTextColor: colors.alpha(colors.blueGreyDark, 0.6),
  returnKeyType: 'search',
  selectionColor: isSearching ? colors.appleBlue : colors.transparent,
  size: 'large',
  spellCheck: false,
  weight: 'semibold',
}))({
  ...(android ? { marginBottom: -10, marginTop: -6 } : {}),
  flex: 1,
  height: ios ? 39 : 56,
  marginBottom: 1,
  marginLeft: ({ isSearching, isLoading }: ContainerProps) => (isSearching || isLoading ? 4 : 0),
  textAlign: ({ isSearching, isLoading }: ContainerProps) => (isSearching || isLoading ? 'left' : 'center'),
});

const SearchSpinner = styled(ImgixImage).attrs(({ theme: { colors } }: ContainerProps) => ({
  resizeMode: ImgixImage.resizeMode.contain,
  source: Spinner,
  tintColor: colors.alpha(colors.blueGreyDark, 0.6),
  size: 30,
}))({
  height: 20,
  width: 20,
});

const SearchSpinnerWrapper = styled(Animated.View)({
  height: 20,
  left: 12,
  position: 'absolute',
  top: 10,
  width: 20,
});

const rotationConfig = {
  duration: 500,
  easing: Easing.linear,
};

const timingConfig = {
  duration: 300,
};

type ExchangeSearchProps = {
  isDiscover: boolean;
  isSearching: boolean;
  isLoading?: boolean;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur?: () => void;
  searchQuery: string;
  testID: string;
  placeholderText: string;
  clearTextOnFocus: boolean;
  currentChainId?: ChainId;
};

const ExchangeSearch = React.forwardRef<TextInput, ExchangeSearchProps>(
  (
    {
      isDiscover,
      isSearching,
      isLoading = false,
      onChangeText,
      onFocus,
      onBlur,
      searchQuery,
      testID,
      placeholderText = lang.t('button.exchange_search_placeholder'),
      clearTextOnFocus = true,
      currentChainId,
    },
    ref
  ) => {
    const handleClearInput = useCallback(() => {
      if (isDiscover && searchQuery.length > 1) {
        analytics.track('Search Query', {
          category: 'discover',
          length: searchQuery.length,
          query: searchQuery,
        });
      }
      ref?.current?.clear();
      onChangeText?.('');
    }, [isDiscover, searchQuery, ref, onChangeText]);

    const spinnerRotation = useSharedValue(0);
    const spinnerScale = useSharedValue(0);

    const placeholder = useMemo(() => {
      if (!currentChainId) return placeholderText;
      return lang.t('button.exchange_search_placeholder_network', {
        network: chainsName[currentChainId],
      });
    }, [currentChainId, placeholderText]);

    const spinnerTimeout = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
      if (isLoading && !isEmpty(searchQuery)) {
        if (spinnerTimeout.current) {
          clearTimeout(spinnerTimeout.current);
        }
        spinnerRotation.value = 0;
        spinnerRotation.value = withRepeat(withTiming(360, rotationConfig), -1, false);
        spinnerScale.value = withTiming(1, timingConfig);
      } else {
        spinnerScale.value = withTiming(0, timingConfig);
        spinnerTimeout.current = setTimeout(() => (spinnerRotation.value = 0), timingConfig.duration);
      }
    }, [isLoading, searchQuery, spinnerRotation, spinnerScale]);

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

    const searchInputValue = useAnimatedProps(() => {
      // Removing the value when the input is focused allows the input to be reset to the correct value on blur
      const query = isSearching ? undefined : '';
      return {
        text: query,
        defaultValue: '',
      };
    });

    return (
      <Container isSearching={isSearching}>
        <BackgroundGradient isDiscover={isDiscover} />
        {isSearching && (
          <>
            <SearchIconWrapper style={searchIconStyle}>
              <SearchIcon>􀊫</SearchIcon>
            </SearchIconWrapper>
            <SearchSpinnerWrapper style={spinnerStyle}>
              <SearchSpinner />
            </SearchSpinnerWrapper>
          </>
        )}
        <SearchInput
          animatedProps={searchInputValue}
          clearTextOnFocus={clearTextOnFocus}
          isSearching={isSearching}
          isLoading={isLoading}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          ref={ref}
          testID={testID + '-input'}
        />
        <ClearInputDecorator
          inputHeight={ExchangeSearchHeight}
          isVisible={searchQuery !== ''}
          onPress={handleClearInput}
          testID={testID + '-clear-input'}
        />
      </Container>
    );
  }
);

ExchangeSearch.displayName = 'ExchangeSearch';

export default ExchangeSearch;
