import React from 'react';
import { SharedValue } from 'react-native-reanimated';
import { Box, Separator, Stack } from '@/design-system';
import { EXPANDED_INPUT_HEIGHT } from '@/__swaps__/screens/Swap/constants';
import { SearchInput } from '@/__swaps__/screens/Swap/components/SearchInput';
import { TokenToSellList } from '@/__swaps__/screens/Swap/components/TokenList/TokenToSellList';
import { TokenToBuyList } from '@/__swaps__/screens/Swap/components/TokenList/TokenToBuyList';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

export const TokenList = ({
  asset,
  handleExitSearchWorklet,
  handleFocusSearchWorklet,
  output,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  handleExitSearchWorklet: () => void;
  handleFocusSearchWorklet: () => void;
  output: boolean;
}) => {
  return (
    <Stack>
      <Stack space="20px">
        <SearchInput
          asset={asset}
          handleExitSearchWorklet={handleExitSearchWorklet}
          handleFocusSearchWorklet={handleFocusSearchWorklet}
          output={output}
        />
        <Separator color="separatorTertiary" thickness={1} />
      </Stack>
      <Box style={{ height: EXPANDED_INPUT_HEIGHT - 77, width: DEVICE_WIDTH - 24 }}>
        {output ? <TokenToBuyList /> : <TokenToSellList />}
      </Box>
    </Stack>
  );
};
