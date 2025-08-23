import { TokenToSellList } from '@/__swaps__/screens/Swap/components/TokenList/TokenToSellList';
import { ParsedSearchAsset, UserAssetFilter } from '@/__swaps__/types/assets';
import { Box } from '@/design-system';
import { EXPANDED_INPUT_HEIGHT } from './constants';
import { ChainId } from '@/state/backendNetworks/types';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import React from 'react';
import { SharedValue } from 'react-native-reanimated';

export interface PerpsTokenListProps {
  onSelectToken?: (token: ParsedSearchAsset | null) => void;
  onSelectChain: (chainId: ChainId | undefined) => void;
  inputProgress?: SharedValue<number>;
  selectedChainId?: SharedValue<UserAssetFilter>;
  onNavigateToNetworkSelector?: () => void;
}

export const PerpsTokenList = (props: PerpsTokenListProps) => {
  return (
    <Box style={{ height: EXPANDED_INPUT_HEIGHT, width: DEVICE_WIDTH - 24 }}>
      <TokenToSellList {...props} />
    </Box>
  );
};
