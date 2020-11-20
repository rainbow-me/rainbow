import React, { useCallback } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components/primitives';
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
})`
  flex-shrink: 0;
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

const ExchangeSearch = (
  { onChangeText, onFocus, searchQuery, testID },
  ref
) => {
  const handleClearInput = useCallback(() => {
    ref?.current?.clear();
    onChangeText?.('');
  }, [ref, onChangeText]);

  return (
    <Container>
      <BackgroundGradient />
      <SearchIcon>􀊫</SearchIcon>
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
