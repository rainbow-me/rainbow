import { memo } from 'react';
import { Text, Box } from '@/design-system';
import { useRnbwStakingBalance } from '@/features/rnbw-staking/stores/derived/useRnbwStakingBalance';
import { useStakableRnbwBalance } from '@/state/rnbw/useStakableRnbwBalance';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';

export const RnbwStakingCard = memo(function RnbwStakingCard() {
  const { tokenAmount, nativeCurrencyAmount, hasStakedPosition } = useRnbwStakingBalance();
  const { tokenAmountFormatted: availableAmount } = useStakableRnbwBalance();

  return (
    <Box background="surfacePrimary" borderRadius={24} padding="20px" gap={20} shadow={'18px'}>
      <Text size="17pt" weight="bold" color="label">
        {'Stake'}
      </Text>
      <Text size="44pt" weight="bold" color="label">
        {nativeCurrencyAmount}
      </Text>
      <Text size="17pt" weight="bold" color="labelTertiary">
        {`${tokenAmount} ${RNBW_SYMBOL}`}
      </Text>
      {!hasStakedPosition && (
        <ButtonPressAnimation onPress={navigateToStakingLearnSheet}>
          <Box backgroundColor="yellow" borderRadius={21} width={'full'} height={42} justifyContent="center" alignItems="center">
            <Text size="17pt" weight="bold" color="label">
              {'Enable Staking'}
            </Text>
          </Box>
        </ButtonPressAnimation>
      )}
      {hasStakedPosition && (
        <Box flexDirection="row" gap={10}>
          <ButtonPressAnimation onPress={navigateToUnstakeSheet} style={{ flex: 1 }}>
            <Box
              flexGrow={1}
              backgroundColor="yellow"
              borderRadius={21}
              width={'full'}
              height={42}
              justifyContent="center"
              alignItems="center"
            >
              <Text size="17pt" weight="bold" color="label">
                {'Unstake'}
              </Text>
            </Box>
          </ButtonPressAnimation>
          <ButtonPressAnimation onPress={navigateToStakingScreen} style={{ flex: 1 }}>
            <Box backgroundColor="yellow" borderRadius={21} width={'full'} height={42} justifyContent="center" alignItems="center">
              <Text size="17pt" weight="bold" color="label">
                {'Add'}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Box>
      )}
      <Text size="13pt" weight="semibold" color="labelTertiary" align="center">
        {`${availableAmount} available to stake`}
      </Text>
    </Box>
  );
});

function navigateToStakingLearnSheet() {
  // TODO:
}

function navigateToStakingScreen() {
  // TODO:
}

function navigateToUnstakeSheet() {
  // TODO:
}
