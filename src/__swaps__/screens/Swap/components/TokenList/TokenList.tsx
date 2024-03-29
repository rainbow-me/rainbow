import React from 'react';
import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { Separator, Stack } from '@/design-system';
import { useDimensions } from '@/hooks';
import { EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT } from '../../constants';
import { SearchInput } from '../SearchInput';
import { TokenToSellList } from './TokenToSellList';
import { TokenToBuyList } from './TokenToBuyList';
import { useSwapContext } from '../../providers/swap-provider';

export const TokenList = ({
  color,
  handleExitSearch,
  handleFocusSearch,
  output,
}: {
  color: string;
  handleExitSearch: () => void;
  handleFocusSearch: () => void;
  output?: boolean;
}) => {
  const { inputProgress, outputProgress } = useSwapContext();
  const { width: deviceWidth } = useDimensions();

  const isFocused = output ? outputProgress.value === 2 : inputProgress.value === 2;

  return (
    <Stack>
      <Stack space="20px">
        <SearchInput color={color} handleExitSearch={handleExitSearch} handleFocusSearch={handleFocusSearch} output={output} />
        <Separator color="separatorTertiary" thickness={1} />
      </Stack>
      <Animated.ScrollView
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
      </Animated.ScrollView>
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
