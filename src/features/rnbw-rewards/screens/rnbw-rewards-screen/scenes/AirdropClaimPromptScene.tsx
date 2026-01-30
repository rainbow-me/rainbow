import { memo, useCallback, useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Box, globalColors, Text, TextIcon } from '@/design-system';
import * as i18n from '@/languages';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import Animated from 'react-native-reanimated';
import { time } from '@/utils/time';
import { defaultExitAnimation, createScaleInFadeInSlideEnterAnimation } from '@/features/rnbw-rewards/animations/sceneTransitions';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwHeroCoin';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { ButtonPressAnimation } from '@/components/animations';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { rewardsFlowActions } from '@/features/rnbw-rewards/stores/rewardsFlowStore';
import { useAccountAddress, useIsHardwareWallet } from '@/state/wallets/walletsStore';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { prepareAirdropClaim } from '@/features/rnbw-rewards/utils/claimAirdrop';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: 24, delay: time.ms(200) });

export const AirdropClaimPromptScene = memo(function AirdropClaimPromptScene() {
  const { tokenAmount, nativeCurrencyAmount } = useAirdropBalanceStore(state => state.getFormattedBalance());
  const hasClaimableAirdrop = useAirdropBalanceStore(state => state.hasClaimableAirdrop());
  const getMessageToSign = useAirdropBalanceStore(state => state.getMessageToSign);
  const { navigate } = useNavigation();

  const accountAddress = useAccountAddress();
  const isHardwareWallet = useIsHardwareWallet();
  const [isPreparingClaim, setIsPreparingClaim] = useState(false);

  const handleClaimLater = () => {
    rewardsFlowActions.setActiveScene(RnbwRewardsScenes.RewardsOverview);
  };

  const showClaimError = useCallback(() => {
    Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
  }, []);

  const startClaimAirdrop = useCallback(async () => {
    setIsPreparingClaim(true);
    try {
      const message = getMessageToSign() ?? '';
      const preparedClaim = await prepareAirdropClaim({ message, address: accountAddress });
      rewardsFlowActions.startAirdropClaimSubmission(preparedClaim);
      rewardsFlowActions.setActiveScene(RnbwRewardsScenes.AirdropClaiming);
    } catch (error) {
      showClaimError();
      setIsPreparingClaim(false);
    }
  }, [accountAddress, getMessageToSign, showClaimError]);

  const handleClaimAirdrop = () => {
    if (isHardwareWallet) {
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: startClaimAirdrop });
    } else {
      startClaimAirdrop();
    }
  };

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
          {i18n.t(i18n.l.rnbw_rewards.claim.your_airdrop_description)}
        </Text>
        <Box gap={28}>
          <HoldToActivateButton
            label={i18n.t(i18n.l.button.hold_to_authorize.hold_to_claim)}
            onLongPress={handleClaimAirdrop}
            backgroundColor={globalColors.white100}
            disabledBackgroundColor={globalColors.white30}
            disabled={false}
            isProcessing={isPreparingClaim}
            processingLabel={i18n.t(i18n.l.button.hold_to_authorize.claiming)}
            showBiometryIcon={false}
            progressColor="black"
            style={styles.button}
            weight="black"
            color="black"
            size="22pt"
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
