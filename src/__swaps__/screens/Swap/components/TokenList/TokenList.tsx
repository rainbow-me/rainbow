import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Separator, Stack } from '@/design-system';
import { useDimensions } from '@/hooks';
import { EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT } from '../../constants';
import { SearchInput } from '../SearchInput';
import { TokenToSellList } from './TokenToSellList';
import { TokenToBuyList } from './TokenToBuyList';

export const TokenList = ({
  color,
  handleExitSearch,
  handleFocusSearch,
  isFocused,
  output,
  setIsFocused,
}: {
  color: string;
  handleExitSearch: () => void;
  handleFocusSearch: () => void;
  isFocused: boolean;
  output?: boolean;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { width: deviceWidth } = useDimensions();

  return (
    <Stack>
      <Stack space="20px">
        <SearchInput
          color={color}
          handleExitSearch={handleExitSearch}
          handleFocusSearch={handleFocusSearch}
          isFocused={isFocused}
          output={output}
          setIsFocused={setIsFocused}
        />
        <Separator color="separatorTertiary" thickness={1} />
      </Stack>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: isFocused ? EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT + 20 : 20,
          paddingTop: 20,
        }}
        showsVerticalScrollIndicator={false}
        style={{
          alignSelf: 'center',
          height: EXPANDED_INPUT_HEIGHT - 77,
          paddingHorizontal: 20,
          width: deviceWidth - 24,
        }}
      >
        {!output && <TokenToSellList />}
        {output && <TokenToBuyList />}
      </ScrollView>
    </Stack>
  );
};

export const styles = StyleSheet.create({
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
