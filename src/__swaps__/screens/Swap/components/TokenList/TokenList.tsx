import React from 'react';

import { SearchInput } from '@/__swaps__/screens/Swap/components/SearchInput';
import { TokenToBuyList } from '@/__swaps__/screens/Swap/components/TokenList/TokenToBuyList';
import { TokenToSellList } from '@/__swaps__/screens/Swap/components/TokenList/TokenToSellList';
import { EXPANDED_INPUT_HEIGHT } from '@/__swaps__/screens/Swap/constants';
import { NAVBAR_HEIGHT_WITH_PADDING } from '@/components/navbar/constants';
import { Box, Separator, Stack } from '@/design-system';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

export const TokenList = ({
  onCancelOrClosePressWorklet,
  onSearchFocusWorklet,
  output,
}: {
  onCancelOrClosePressWorklet: () => void;
  onSearchFocusWorklet: () => void;
  output: boolean;
}) => {
  return (
    <Stack>
      <Stack space="20px">
        <SearchInput
          onCancelOrClosePressWorklet={onCancelOrClosePressWorklet}
          onSearchFocusWorklet={onSearchFocusWorklet}
          output={output}
        />
        <Separator color="separatorTertiary" thickness={1} />
      </Stack>
      <Box style={{ height: EXPANDED_INPUT_HEIGHT - NAVBAR_HEIGHT_WITH_PADDING, width: DEVICE_WIDTH - 24 }}>
        {output ? <TokenToBuyList /> : <TokenToSellList />}
      </Box>
    </Stack>
  );
};
