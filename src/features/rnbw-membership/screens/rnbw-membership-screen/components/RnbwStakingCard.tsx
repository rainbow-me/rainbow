import { memo, useCallback } from 'react';
import { Text, Box } from '@/design-system';
import { useStakingBalance } from '@/features/rnbw-staking/stores/derived/useStakingBalance';
import { useRnbwBalance } from '@/state/rnbw/useRnbwBalance';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

export const RnbwStakingCard = memo(function RnbwStakingCard() {
  const { navigate } = useNavigation();
  const { tokenAmount, nativeCurrencyAmount, hasStakedPosition } = useStakingBalance();
  const { tokenAmountFormatted: availableAmount } = useRnbwBalance();

  const handlePressEnableStaking = useCallback(() => {
    navigate(Routes.RNBW_STAKING_LEARN_SHEET);
  }, [navigate]);

  const handlePressAddToStake = useCallback(() => {
    navigate(Routes.RNBW_STAKING_SCREEN);
  }, [navigate]);

  const handlePressUnstake = useCallback(() => {
    //
  }, []);

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
        <ButtonPressAnimation onPress={handlePressEnableStaking}>
          <Box backgroundColor="yellow" borderRadius={21} width={'full'} height={42} justifyContent="center" alignItems="center">
            <Text size="17pt" weight="bold" color="label">
              {'Enable Staking'}
            </Text>
          </Box>
        </ButtonPressAnimation>
      )}
      {hasStakedPosition && (
        <Box flexDirection="row" gap={10}>
          <ButtonPressAnimation onPress={handlePressUnstake} style={{ flex: 1 }}>
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
          <ButtonPressAnimation onPress={handlePressAddToStake} style={{ flex: 1 }}>
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
