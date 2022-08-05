import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Spinner from '../../assets/chartSpinner.png';
import DiscoverSheetContext from '../discover-sheet/DiscoverSheetContext';
import { ClearInputDecorator, Input } from '../inputs';
import { Row } from '../layout';
import { Text } from '../text';
import { analytics } from '@rainbow-me/analytics';
import { ImgixImage } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';
import { colors, margin, padding } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

export const ExchangeSearchHeight = 40;
const DoneButtonWidth = 52;
const ExchangeSearchWidth = deviceUtils.dimensions.width - 40;

const Container = styled(Row)(({ isSearchModeEnabled }) => ({
  ...(isSearchModeEnabled ? padding.object(0, 37, 0, 12) : padding.object(0)),
  backgroundColor: colors.transparent,
  borderRadius: ExchangeSearchHeight / 2,
  height: ExchangeSearchHeight,
}));

const ShadowContainer = styled(ShadowStack)(() => ({
  ...margin.object(0, 20, 20, 20),
}));

const BackgroundGradient = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: colors.gradients.offWhite,
    end: { x: 0.5, y: 1 },
    start: { x: 0.5, y: 0 },
  })
)({
  borderRadius: ExchangeSearchHeight / 2,
  height: ExchangeSearchWidth,
  left: 0,
  overflow: 'hidden',
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
  marginTop: android ? 6 : 9,
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

const ExchangeSearchShadowsFactory = colors => [
  [0, 7, 21, colors.shadow, 0.15],
  [0, 3.5, 10.5, colors.shadow, 0.04],
];

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

  const ExchangeSearchWidthFocused = isDiscover
    ? ExchangeSearchWidth - DoneButtonWidth
    : ExchangeSearchWidth;

  const spinnerRotation = useSharedValue(0);
  const spinnerScale = useSharedValue(0);
  const { isSearchModeEnabled = true } = useContext(DiscoverSheetContext) || {};

  const spinnerTimeout = useRef();
  const { colors } = useTheme();
  const shadows = useMemo(() => ExchangeSearchShadowsFactory(colors), [colors]);

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
    <ShadowContainer
      backgroundColor={colors.white}
      borderRadius={ExchangeSearchHeight / 2}
      height={ExchangeSearchHeight}
      isSearchModeEnabled={isSearchModeEnabled}
      shadows={shadows}
      width={
        isSearchModeEnabled ? ExchangeSearchWidthFocused : ExchangeSearchWidth
      }
    >
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
          placeholder={placeholderText}
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
    </ShadowContainer>
  );
};

export default React.forwardRef(ExchangeSearch);
