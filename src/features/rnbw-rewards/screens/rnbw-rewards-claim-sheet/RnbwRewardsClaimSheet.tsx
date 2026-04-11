import { memo, useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';

import rnbwCoinImage from '@/assets/rnbw.png';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Stack, Text } from '@/design-system';
import { RnbwHoldToActivateButton } from '@/features/rnbw-membership/components/RnbwHoldToActivateButton';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { prepareRewardsClaim, submitRewardsClaim } from '@/features/rnbw-rewards/utils/claimRewards';
import { useStableValue } from '@/hooks/useStableValue';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useAccountAddress, useIsHardwareWallet, useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import watchingAlert from '@/utils/watchingAlert';

export const RnbwRewardsClaimSheet = memo(function RnbwRewardsClaimSheet() {
  const { goBack, navigate } = useNavigation();
  const accountAddress = useAccountAddress();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const isHardwareWallet = useIsHardwareWallet();
  const { tokenAmount, nativeCurrencyAmount } = useStableValue(() => useRewardsBalanceStore.getState().getFormattedBalance());
  const [isProcessing, setIsProcessing] = useState(false);

  const startClaim = useCallback(async () => {
    setIsProcessing(true);
    try {
      const preparedClaim = await prepareRewardsClaim({ address: accountAddress });
      const currency = userAssetsStoreManager.getState().currency;
      await submitRewardsClaim({ preparedClaim, currency });
      goBack();
    } catch {
      setIsProcessing(false);
      Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
    }
  }, [accountAddress, goBack]);

  const handleClaim = useCallback(() => {
    if (isReadOnlyWallet) {
      watchingAlert();
      return;
    }
    if (isHardwareWallet) {
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: startClaim });
    } else {
      startClaim();
    }
  }, [isReadOnlyWallet, isHardwareWallet, navigate, startClaim]);

  return (
    <PanelSheet>
      <View style={styles.content}>
        <Stack space="36px" alignHorizontal="center">
          <Text size="20pt" weight="heavy" color="label" align="center">
            {i18n.t(i18n.l.rnbw_rewards.claim.claim_title)}
          </Text>
          <Stack space="16px" alignHorizontal="center">
            <Image source={rnbwCoinImage} style={styles.coinImage} />
            <Stack space="12px" alignHorizontal="center">
              <Text size="44pt" weight="heavy" color="label" align="center">
                {nativeCurrencyAmount}
              </Text>
              <Text size="17pt" weight="bold" color="labelTertiary" align="center">
                {`${tokenAmount} ${RNBW_SYMBOL}`}
              </Text>
            </Stack>
          </Stack>
          <Box width="full">
            <RnbwHoldToActivateButton
              isProcessing={isProcessing}
              label={i18n.t(i18n.l.button.hold_to_authorize.hold_to_claim)}
              onActivate={handleClaim}
              processingLabel={i18n.t(i18n.l.button.hold_to_authorize.claiming)}
            />
          </Box>
        </Stack>
      </View>
    </PanelSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingTop: 36,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  coinImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  button: {
    width: '100%',
  },
});
