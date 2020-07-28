import React, { useCallback } from 'react';
import styled from 'styled-components/primitives';
import { Icon } from '../icons';
import { ClearInputDecorator, Input } from '../inputs';
import { InnerBorder, Row } from '../layout';
import { colors, margin, padding } from '@rainbow-me/styles';

export const ExchangeSearchHeight = 40;

const Container = styled(Row)`
  ${margin(0, 15, 8)};
  ${padding(0, 37, 0, 13)};
  background-color: ${colors.skeleton};
  border-radius: ${ExchangeSearchHeight / 2};
  height: ${ExchangeSearchHeight};
`;

const SearchIcon = styled(Icon).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.4),
  name: 'search',
})`
  flex-shrink: 0;
  margin-top: 10.5;
`;

const SearchInput = styled(Input).attrs({
  autoCapitalize: 'words',
  blurOnSubmit: false,
  clearTextOnFocus: true,
  enablesReturnKeyAutomatically: true,
  keyboardAppearance: 'dark',
  keyboardType: 'ascii-capable',
  lineHeight: 'loose',
  placeholderTextColor: colors.grey,
  returnKeyType: 'search',
  selectionColor: colors.appleBlue,
  size: 'large',
  spellCheck: false,
})`
  flex: 1;
  margin-left: 7;
`;

const ExchangeSearch = ({ onChangeText, onFocus, searchQuery }, ref) => {
  const handleClearInput = useCallback(() => {
    ref?.current?.clear();
    onChangeText?.('');
  }, [ref, onChangeText]);

  return (
    <Container>
      <SearchIcon />
      <SearchInput
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder="Search"
        ref={ref}
        value={searchQuery}
      />
      <ClearInputDecorator
        inputHeight={ExchangeSearchHeight}
        isVisible={searchQuery !== ''}
        onPress={handleClearInput}
      />
      <InnerBorder
        color={colors.dark}
        opacity={0.01}
        radius={ExchangeSearchHeight / 2}
      />
    </Container>
  );
};

export default React.forwardRef(ExchangeSearch);
