import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Spinner from '@/assets/chartSpinner.png';
import { ClearInputDecorator, Input } from '@/components/inputs';
import { Row } from '@/components/layout';
import { TextIcon } from '@/design-system';
import { analytics } from '@/analytics';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { deviceUtils } from '@/utils';
import { ThemeContextProps, useTheme } from '@/theme';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { useDiscoverSearchQueryStore, useDiscoverSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
const SearchHeight = 40;
const SearchWidth = deviceUtils.dimensions.width - 30;

type ContainerProps = {
  isSearching: boolean;
  isDiscover: boolean;
  clearTextOnFocus: boolean;
  theme: ThemeContextProps;
};

const Container = styled(Row)(({ isSearching, theme: { colors } }: ContainerProps) => ({
  ...(isSearching ? padding.object(0, 37, 0, 12) : padding.object(0)),
  backgroundColor: colors.transparent,
  borderRadius: SearchHeight / 2,
  height: SearchHeight,
  overflow: 'hidden',
}));

const BackgroundGradient = styled(RadialGradient).attrs(({ isDiscover, theme: { colors } }: ContainerProps) => ({
  center: [SearchWidth, SearchWidth / 2],
  colors: isDiscover ? colors.gradients.searchBar : colors.gradients.lightGreyTransparent,
}))({
  height: SearchWidth,
  position: 'absolute',
  top: -(SearchWidth - SearchHeight) / 2,
  transform: [{ scaleY: SearchHeight / SearchWidth }],
  width: SearchWidth,
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
  flex: 1,
  height: 39,
  paddingVertical: 0,
  marginBottom: 1,
  marginLeft: ({ isSearching }: ContainerProps) => (isSearching ? 4 : 0),
  textAlign: ({ isSearching }: ContainerProps) => (isSearching ? 'left' : 'center'),
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

type DiscoverSearchInputProps = {
  isDiscover: boolean;
  onFocus: ({ target }: { target: any }) => void;
  onBlur?: () => void;
  testID: string;
  placeholderText?: string;
  clearTextOnFocus: boolean;
  currentChainId?: ChainId;
};

const DiscoverSearchInput = ({
  isDiscover,
  onFocus,
  onBlur,
  testID,
  placeholderText = lang.t('button.exchange_search_placeholder'),
  clearTextOnFocus = true,
  currentChainId,
}: DiscoverSearchInputProps) => {
  const { colors } = useTheme();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);
  const searchQuery = useDiscoverSearchQueryStore(state => state.searchQuery);
  const isLoading = useDiscoverSearchStore(state => state.getStatus().isFetching);
  const onChangeText = useCallback((updatedQuery: string) => {
    useDiscoverSearchQueryStore.setState({ searchQuery: updatedQuery });
  }, []);

  const { searchInputRef } = useDiscoverScreenContext();
  const handleClearInput = useCallback(() => {
    if (isDiscover && searchQuery.length > 1) {
      analytics.track(analytics.event.searchQuery, {
        category: 'discover',
        length: searchQuery.length,
        query: searchQuery,
      });
    }
    searchInputRef?.current?.clear();
    onChangeText?.('');
  }, [isDiscover, searchQuery, searchInputRef, onChangeText]);

  const spinnerRotation = useSharedValue(0);
  const spinnerScale = useSharedValue(0);

  const placeholder = useMemo(() => {
    if (!currentChainId) return placeholderText;
    return lang.t('button.exchange_search_placeholder_network', {
      network: useBackendNetworksStore.getState().getChainsName()[currentChainId],
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
    const query = isLoading ? undefined : '';
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
          <Animated.View style={[searchIconStyle, { justifyContent: 'center', marginRight: 4 }]}>
            <TextIcon color={{ custom: colors.alpha(colors.blueGreyDark, 0.6) }} size="icon 18px" weight="semibold">
              {'􀊫'}
            </TextIcon>
          </Animated.View>
          <SearchSpinnerWrapper style={spinnerStyle}>
            <SearchSpinner />
          </SearchSpinnerWrapper>
        </>
      )}
      <SearchInput
        animatedProps={searchInputValue}
        clearTextOnFocus={clearTextOnFocus}
        isSearching={isSearching}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        ref={searchInputRef}
        value={searchQuery}
        autoFocus
        testID={testID + '-input'}
      />
      <ClearInputDecorator
        inputHeight={SearchHeight}
        isVisible={searchQuery !== ''}
        onPress={handleClearInput}
        testID={testID + '-clear-input'}
      />
    </Container>
  );
};

export default DiscoverSearchInput;
