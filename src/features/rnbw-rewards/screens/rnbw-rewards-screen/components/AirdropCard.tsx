import { memo } from 'react';
import { Box, Text } from '@/design-system';
import { useAirdropStore } from '@/features/rnbw-rewards/stores/airdropStore';
import { convertAmountToBalanceDisplayWorklet } from '@/helpers/utilities';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { useRnbwRewardsContext } from '@/features/rnbw-rewards/context/RnbwRewardsContext';

export const AirdropCard = memo(function AirdropCard() {
  const { setShowAirdropFlow } = useRnbwRewardsContext();
  const { tokenAmount, nativeCurrencyAmount } = useAirdropStore(state => state.getBalance());
  return (
    <ButtonPressAnimation onPress={() => setShowAirdropFlow(true)} scaleTo={0.96}>
      <Box background="black" borderRadius={16} padding="20px" gap={12} alignItems="center">
        <Text size="22pt" weight="heavy" color="label">
          {'Airdrop'}
        </Text>
        <Text size="44pt" weight="heavy" color="label">
          {nativeCurrencyAmount}
        </Text>
        <Text size="22pt" weight="heavy" color="label">
          {`${convertAmountToBalanceDisplayWorklet(tokenAmount, { decimals: 2, symbol: 'RNBW' })}`}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
});
