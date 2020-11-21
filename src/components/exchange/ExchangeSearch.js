import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';
import FastImage from 'react-native-fast-image';
import RadialGradient from 'react-native-radial-gradient';
import Animated, {
  NewEasing,
  repeat,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import Spinner from '../../assets/chartSpinner.png';
import { ClearInputDecorator, Input } from '../inputs';
import { Row } from '../layout';
import { Text } from '../text';
import { colors, margin, padding } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';

export const ExchangeSearchHeight = 40;
const ExchangeSearchWidth = deviceUtils.dimensions.width - 30;

const Container = styled(Row)`
  ${margin(0, 15, 8)};
  ${padding(0, 37, 0, 12)};
  background-color: ${colors.transparent};
  border-radius: ${ExchangeSearchHeight / 2};
  height: ${ExchangeSearchHeight};
  overflow: hidden;
`;

const BackgroundGradient = styled(RadialGradient).attrs({
  center: [ExchangeSearchWidth, ExchangeSearchWidth / 2],
  colors: ['#FCFDFE', '#F0F2F5'],
})`
  position: absolute;
  height: ${ExchangeSearchWidth};
  top: ${-(ExchangeSearchWidth - ExchangeSearchHeight) / 2};
  transform: scaleY(${ExchangeSearchHeight / ExchangeSearchWidth});
  width: ${ExchangeSearchWidth};
`;

const SearchIcon = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.5),
  size: 'large',
  weight: 'semibold',
})``;

const SearchIconWrapper = styled(Animated.View)`
  margin-top: ${android ? '5' : '9'};
`;

const SearchInput = styled(Input).attrs({
  autoCapitalize: 'words',
  blurOnSubmit: false,
  clearTextOnFocus: true,
  color: colors.alpha(colors.blueGreyDark, 0.8),
  enablesReturnKeyAutomatically: true,
  keyboardAppearance: 'dark',
  keyboardType: 'ascii-capable',
  lineHeight: 'loose',
  placeholderTextColor: colors.alpha(colors.blueGreyDark, 0.5),
  returnKeyType: 'search',
  selectionColor: colors.appleBlue,
  size: 'large',
  spellCheck: false,
  weight: 'semibold',
})`
  ${android
    ? `margin-top: -6;
  margin-bottom: -10;
  height: 56;`
    : ''}
  flex: 1;
  margin-left: 4;
`;

const SearchSpinner = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.contain,
  source: Spinner,
  tintColor: colors.alpha(colors.blueGreyDark, 0.6),
})`
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
  easing: NewEasing.linear,
};

const timingConfig = {
  duration: 300,
};

const ExchangeSearch = (
  { isFetching, isSearching, onChangeText, onFocus, searchQuery, testID },
  ref
) => {
  const handleClearInput = useCallback(() => {
    ref?.current?.clear();
    onChangeText?.('');
  }, [ref, onChangeText]);

  const spinnerRotation = useSharedValue(0);
  const spinnerScale = useSharedValue(0, 'spinnerScale');

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

  const searchIconStyle = useAnimatedStyle(
    () => {
      return {
        opacity: 1 - spinnerScale.value,
        transform: [{ scale: 1 - spinnerScale.value }],
      };
    },
    undefined,
    'searchIconStyle'
  );

  const spinnerStyle = useAnimatedStyle(
    () => {
      return {
        opacity: spinnerScale.value,
        transform: [
          { rotate: `${spinnerRotation.value}deg` },
          { scale: spinnerScale.value },
        ],
      };
    },
    undefined,
    'spinnerStyle'
  );

  return (
    <Container>
      <BackgroundGradient />
      <SearchIconWrapper style={searchIconStyle}>
        <SearchIcon>􀊫</SearchIcon>
      </SearchIconWrapper>
      <SearchSpinnerWrapper style={spinnerStyle}>
        <SearchSpinner />
      </SearchSpinnerWrapper>
      <SearchInput
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder="Search Uniswap"
        ref={ref}
        testID={testID + '-input'}
        value={searchQuery}
      />
      <ClearInputDecorator
        inputHeight={ExchangeSearchHeight}
        isVisible={searchQuery !== ''}
        onPress={handleClearInput}
      />
    </Container>
  );
};

export default React.forwardRef(ExchangeSearch);
