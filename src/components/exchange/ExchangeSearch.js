import { isEmpty } from 'lodash';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Animated, {
  Easing,
  repeat,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components';
import Spinner from '../../assets/chartSpinner.png';
import DiscoverSheetContext from '../discover-sheet/DiscoverSheetContext';
import { ClearInputDecorator, Input } from '../inputs';
import { Row } from '../layout';
import { Text } from '../text';
import { ImgixImage } from '@rainbow-me/images';
import { margin, padding } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';

export const ExchangeSearchHeight = 40;
const ExchangeSearchWidth = deviceUtils.dimensions.width - 30;

const Container = styled(Row)`
  ${margin(0, 15, 8)};
  ${({ isSearchModeEnabled }) =>
    isSearchModeEnabled ? padding(0, 37, 0, 12) : padding(0)};
  background-color: ${({ theme: { colors } }) => colors.transparent};
  border-radius: ${ExchangeSearchHeight / 2};
  height: ${ExchangeSearchHeight};
  overflow: hidden;
`;

const BackgroundGradient = styled(RadialGradient).attrs(
  ({ theme: { colors } }) => ({
    center: [ExchangeSearchWidth, ExchangeSearchWidth / 2],
    colors: colors.gradients.searchBar,
  })
)`
  height: ${ExchangeSearchWidth};
  position: absolute;
  top: ${-(ExchangeSearchWidth - ExchangeSearchHeight) / 2};
  transform: scaleY(${ExchangeSearchHeight / ExchangeSearchWidth});
  width: ${ExchangeSearchWidth};
`;

const SearchIcon = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.5),
  size: 'large',
  weight: 'semibold',
}))``;

const SearchIconWrapper = styled(Animated.View)`
  margin-top: ${android ? '5' : '8'};
`;

const SearchInput = styled(Input).attrs(
  ({ theme: { colors }, isSearchModeEnabled, clearTextOnFocus }) => ({
    autoCapitalize: 'words',
    blurOnSubmit: false,
    clearTextOnFocus,
    color: colors.alpha(colors.blueGreyDark, 0.8),
    enablesReturnKeyAutomatically: true,
    keyboardAppearance: 'dark',
    keyboardType: 'ascii-capable',
    lineHeight: 'loose',
    placeholderTextColor: colors.alpha(colors.blueGreyDark, 0.5),
    returnKeyType: 'search',
    selectionColor: isSearchModeEnabled ? colors.appleBlue : colors.transparent,
    size: 'large',
    spellCheck: false,
    weight: 'semibold',
  })
)`
  ${android
    ? `margin-top: -6;
  margin-bottom: -10;`
    : ''}
  flex: 1;
  text-align: ${({ isSearchModeEnabled }) =>
    isSearchModeEnabled ? 'left' : 'center'};
  height: ${ios ? 38 : 56};
  margin-bottom: 1;
  margin-left: ${({ isSearchModeEnabled }) => (isSearchModeEnabled ? 3 : 0)};
`;

const SearchSpinner = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  resizeMode: ImgixImage.resizeMode.contain,
  source: Spinner,
  tintColor: colors.alpha(colors.blueGreyDark, 0.6),
}))`
  height: 20;
  width: 20;
`;

const SearchSpinnerWrapper = styled(Animated.View)`
  height: 20;
  left: 12;
  position: absolute;
  top: 9.5;
  width: 20;
`;

const rotationConfig = {
  duration: 500,
  easing: Easing.linear,
};

const timingConfig = {
  duration: 300,
};

const ExchangeSearch = (
  {
    isFetching,
    isSearching,
    onChangeText,
    onFocus,
    searchQuery,
    testID,
    placeholderText = 'Search Uniswap',
    clearTextOnFocus = true,
  },
  ref
) => {
  const handleClearInput = useCallback(() => {
    ref?.current?.clear();
    onChangeText?.('');
  }, [ref, onChangeText]);

  const spinnerRotation = useSharedValue(0);
  const spinnerScale = useSharedValue(0);
  const { isSearchModeEnabled = true } = useContext(DiscoverSheetContext) || {};

  const spinnerTimeout = useRef();
  useEffect(() => {
    if ((isFetching || isSearching) && !isEmpty(searchQuery)) {
      clearTimeout(spinnerTimeout.current);
      spinnerRotation.value = 0;
      spinnerRotation.value = repeat(
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
  );
};

export default React.forwardRef(ExchangeSearch);
