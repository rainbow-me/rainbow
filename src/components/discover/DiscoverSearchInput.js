import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Spinner from '../../assets/chartSpinner.png';
import { ClearInputDecorator, Input } from '../inputs';
import { Row } from '../layout';
import { Text } from '../text';
import { analytics } from '@/analytics';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { margin, padding } from '@/styles';
import { deviceUtils, ethereumUtils } from '@/utils';
import networkInfo from '@/helpers/networkInfo';
import DiscoverSheetContext from '@/screens/discover/DiscoverScreenContext';

export const ExchangeSearchHeight = 40;
const ExchangeSearchWidth = deviceUtils.dimensions.width - 30;

const Container = styled(Row)(({ isSearchModeEnabled, theme: { colors } }) => ({
  ...margin.object(0, 15, isSearchModeEnabled ? 8 : 0),
  ...(isSearchModeEnabled ? padding.object(0, 37, 0, 12) : padding.object(0)),
  backgroundColor: colors.transparent,
  borderRadius: ExchangeSearchHeight / 2,
  height: ExchangeSearchHeight,
  overflow: 'hidden',
}));

const BackgroundGradient = styled(RadialGradient).attrs(
  ({ theme: { colors } }) => ({
    center: [ExchangeSearchWidth, ExchangeSearchWidth / 2],
    colors: colors.gradients.searchBar,
  })
)({
  height: ExchangeSearchWidth,
  position: 'absolute',
  top: -(ExchangeSearchWidth - ExchangeSearchHeight) / 2,
  transform: [{ scaleY: ExchangeSearchHeight / ExchangeSearchWidth }],
  width: ExchangeSearchWidth,
});

const SearchIcon = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  size: 'large',
  weight: 'semibold',
}))({});

const SearchIconWrapper = styled(Animated.View)({
  marginTop: android ? 4 : 9,
});

const SearchInput = styled(Input).attrs(
  ({ theme: { colors }, isSearchModeEnabled, clearTextOnFocus }) => ({
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
  marginLeft: ({ isSearchModeEnabled }) => (isSearchModeEnabled ? 4 : 0),
  textAlign: ({ isSearchModeEnabled }) =>
    isSearchModeEnabled ? 'left' : 'center',
});

const SearchSpinner = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  resizeMode: ImgixImage.resizeMode.contain,
  source: Spinner,
  tintColor: colors.alpha(colors.blueGreyDark, 0.6),
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

const ExchangeSearch = (
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
  const { isSearchModeEnabled = true } = useContext(DiscoverSheetContext) || {};

  const placeholder = useMemo(() => {
    if (!currentChainId) return placeholderText;
    const network = ethereumUtils.getNetworkFromChainId(currentChainId);
    return lang.t('button.exchange_search_placeholder_network', {
      network: networkInfo[network].name,
    });
  }, [currentChainId, placeholderText]);

  const spinnerTimeout = useRef();
  useEffect(() => {
    if ((isFetching || isSearching) && !isEmpty(searchQuery)) {
      clearTimeout(spinnerTimeout.current);
      spinnerRotation.value = 0;
      spinnerRotation.value = withRepeat(
        withTiming(360, rotationConfig),
        -1,
        false
      );
      spinnerScale.value = withTiming(1, timingConfig);
    } else {
      spinnerScale.value = withTiming(0, timingConfig);
      spinnerTimeout.current = setTimeout(
        () => (spinnerRotation.value = 0),
        timingConfig.duration
      );
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
      transform: [
        { rotate: `${spinnerRotation.value}deg` },
        { scale: spinnerScale.value },
      ],
    };
  });

  return (
    <Container isSearchModeEnabled={isSearchModeEnabled}>
      <BackgroundGradient />
      {isSearchModeEnabled && (
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
        clearTextOnFocus={clearTextOnFocus}
        isSearchModeEnabled={isSearchModeEnabled}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        ref={ref}
        testID={testID + '-input'}
        value={searchQuery}
      />
      <ClearInputDecorator
        inputHeight={ExchangeSearchHeight}
        isVisible={searchQuery !== ''}
        onPress={handleClearInput}
        testID={testID + '-clear-input'}
      />
    </Container>
  );
};

export default React.forwardRef(ExchangeSearch);
