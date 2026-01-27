import { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Box, globalColors, Text, TextIcon } from '@/design-system';
import * as i18n from '@/languages';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { useRnbwRewardsFlowContext } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsFlowContext';
import Animated from 'react-native-reanimated';
import { time } from '@/utils/time';
import { defaultExitAnimation, createScaleInFadeInSlideEnterAnimation } from '@/features/rnbw-rewards/animations/sceneTransitions';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwHeroCoin';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { ButtonPressAnimation } from '@/components/animations';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { rewardsFlowActions } from '@/features/rnbw-rewards/stores/rewardsFlowStore';
import { usePoints } from '@/resources/points';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { getNumberFormatter } from '@/helpers/intl';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: 24, delay: time.ms(200) });

export const AirdropClaimPromptScene = memo(function AirdropClaimPromptScene() {
  const { setActiveScene } = useRnbwRewardsFlowContext();
  const { tokenAmount, nativeCurrencyAmount } = useAirdropBalanceStore(state => state.getFormattedBalance());
  const hasClaimableAirdrop = useAirdropBalanceStore(state => state.hasClaimableAirdrop());

  const accountAddress = useAccountAddress();
  const { data: pointsData } = usePoints({ walletAddress: accountAddress });
  const totalPoints = pointsData?.points?.user?.earnings?.total;
  const rank = pointsData?.points?.user?.stats?.position?.current;
  const isUnranked = pointsData?.points?.user?.stats?.position?.unranked;

  const handleClaimLater = () => {
    'worklet';
    setActiveScene(RnbwRewardsScenes.RewardsOverview);
  };

  const handleClaimAirdrop = () => {
    'worklet';
    rewardsFlowActions.startAirdropClaim();
    setActiveScene(RnbwRewardsScenes.AirdropClaiming);
  };

  const formattedPoints = useMemo(() => (totalPoints != null ? getNumberFormatter('en-US').format(totalPoints) : '—'), [totalPoints]);
  const formattedRank = useMemo(
    () => (rank != null && !isUnranked ? `#${getNumberFormatter('en-US').format(rank)}` : '—'),
    [rank, isUnranked]
  );

  return (
    <Animated.View style={styles.container} entering={enteringAnimation} exiting={defaultExitAnimation}>
      <View style={styles.amountContainer}>
        <Box gap={16} alignItems="center" width="full">
          <Text size="22pt" weight="heavy" color="labelQuaternary" align="center">
            {i18n.t(i18n.l.rnbw_rewards.claim.your_airdrop).toUpperCase()}
          </Text>
          <Text size="64pt" weight="heavy" color="label" align="center">
            {nativeCurrencyAmount}
          </Text>
          <Text size="20pt" weight="bold" color={hasClaimableAirdrop ? 'label' : 'labelQuaternary'} align="center">
            {`${tokenAmount} ${RNBW_SYMBOL}`}
          </Text>
        </Box>
      </View>
      <Box gap={24} alignItems="center" paddingHorizontal={{ custom: 40 }}>
        <Text color={{ custom: '#989A9E' }} size="17pt / 150%" weight="semibold" align="center">
          {i18n.t(i18n.l.rnbw_rewards.claim.based_on_your_swaps_prefix)}
          <Text color="label" weight="bold" size="17pt / 150%">
            {formattedPoints}
          </Text>
          {i18n.t(i18n.l.rnbw_rewards.claim.based_on_your_swaps_middle)}
          <Text color="label" weight="bold" size="17pt / 150%">
            {formattedRank}
          </Text>
          {i18n.t(i18n.l.rnbw_rewards.claim.based_on_your_swaps_suffix)}
        </Text>
        <Box gap={28}>
          <HoldToActivateButton
            label={i18n.t(i18n.l.button.hold_to_authorize.hold_to_claim)}
            onLongPress={handleClaimAirdrop}
            backgroundColor={globalColors.white100}
            disabledBackgroundColor={globalColors.white30}
            disabled={false}
            isProcessing={false}
            processingLabel={i18n.t(i18n.l.button.hold_to_authorize.claiming)}
            showBiometryIcon={false}
            progressColor="black"
            style={styles.button}
            weight="black"
            color="black"
            size="24pt"
          />
          <ButtonPressAnimation onPress={handleClaimLater} scaleTo={0.96}>
            <Box flexDirection="row" gap={8} alignItems="center" justifyContent="center">
              <Text color="labelTertiary" size="17pt" weight="bold" align="center">
                {i18n.t(i18n.l.rnbw_rewards.claim.claim_later)}
              </Text>
              <TextIcon color="labelQuaternary" size="icon 13px" weight="bold" align="center">
                {'􀆊'}
              </TextIcon>
            </Box>
          </ButtonPressAnimation>
        </Box>
      </Box>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  button: {
    height: 51,
    width: 260,
    borderRadius: 26,
  },
  amountContainer: {
    position: 'absolute',
    top: getCoinBottomPosition(RnbwRewardsScenes.AirdropClaimPrompt) + 32,
    width: '100%',
  },
});
