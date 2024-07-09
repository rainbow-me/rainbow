import React from 'react';
import { Box, Separator, Stack } from '@/design-system';
import { EXPANDED_INPUT_HEIGHT } from '@/__swaps__/screens/Swap/constants';
import { SearchInput } from '@/__swaps__/screens/Swap/components/SearchInput';
import { TokenToSellList } from '@/__swaps__/screens/Swap/components/TokenList/TokenToSellList';
import { TokenToBuyList } from '@/__swaps__/screens/Swap/components/TokenList/TokenToBuyList';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

export const TokenList = ({
  handleExitSearchWorklet,
  handleFocusSearchWorklet,
  output,
}: {
  handleExitSearchWorklet: () => void;
  handleFocusSearchWorklet: () => void;
  output: boolean;
}) => {
  return (
    <Stack>
      <Stack space="20px">
        <SearchInput
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
