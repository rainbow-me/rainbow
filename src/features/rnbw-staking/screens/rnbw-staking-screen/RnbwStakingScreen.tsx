import { memo, useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SheetHandleFixedToTop from '@/components/sheet/SheetHandleFixedToTop';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { Box, Stack, Text } from '@/design-system';
import { useIsReadOnlyWallet, useIsHardwareWallet } from '@/state/wallets/walletsStore';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import watchingAlert from '@/utils/watchingAlert';
import { logger, RainbowError } from '@/logger';

export const RnbwStakingScreen = memo(function RnbwStakingScreen() {
  const { top: safeAreaTop } = useSafeAreaInsets();
  const { goBack, navigate } = useNavigation();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const isHardwareWallet = useIsHardwareWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const startStake = useCallback(async () => {
    setIsProcessing(true);
    try {
      // TODO: Implement staking logic
      goBack();
    } catch (e) {
      setIsProcessing(false);
      Alert.alert('Staking Failed', 'Something went wrong while staking. Please try again.');
      logger.error(new RainbowError('[RnbwStakingScreen]: Staking failed', e));
    }
  }, [goBack]);

  const handleStake = useCallback(async () => {
    if (isReadOnlyWallet) {
      watchingAlert();
      return;
    }
    if (isHardwareWallet) {
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: startStake });
    } else {
      await startStake();
    }
  }, [isReadOnlyWallet, isHardwareWallet, navigate, startStake]);

  return (
    <Box background="surfacePrimary" style={styles.container}>
      <SheetHandleFixedToTop top={safeAreaTop + 6} />
      <View style={[styles.content, { marginTop: safeAreaTop + 40 }]}>
        <Stack space="24px">
          <Text color="label" size="30pt" weight="heavy">
            Stake RNBW
          </Text>
          <Text color="labelSecondary" size="17pt" weight="medium">
            {'Stake 1 RNBW to enable membership rewards.'}
          </Text>
        </Stack>
        <View style={styles.buttonContainer}>
          <HoldToActivateButton
            label="Hold to Stake"
            processingLabel="Staking..."
            onLongPress={handleStake}
            isProcessing={isProcessing}
            backgroundColor="white"
            disabledBackgroundColor="white"
            progressColor="black"
            showBiometryIcon
            style={styles.button}
          />
        </View>
      </View>
    </Box>
  );
});

const styles = StyleSheet.create({
  button: {
    width: '100%',
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: 36,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
