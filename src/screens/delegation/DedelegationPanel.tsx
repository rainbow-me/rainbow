import React, { useCallback, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation } from '@/navigation';
import { Box, Text } from '@/design-system';
import { ClaimButton } from '@/screens/claimables/shared/components/ClaimButton';
import { ClaimPanel } from '@/screens/claimables/shared/components/ClaimPanel';
import { ClaimStatus } from '@/screens/claimables/shared/types';
import { useAccountSettings } from '@/hooks';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';
import { haptics } from '@/utils';
import { removeDelegation } from '@/delegateActions';
import { loadWalletViem } from '@/model/wallet';
import { createPublicClient, http } from 'viem';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const DedelegationPanel = () => {
  const { goBack } = useNavigation();
  const {
    params: { delegationsToRevoke },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.DEDELEGATION_PANEL>>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('ready');
  const { accountAddress } = useAccountSettings();

  const currentDelegation = delegationsToRevoke[currentIndex];
  const isLastDelegation = currentIndex === delegationsToRevoke.length - 1;

  const handleRevoke = useCallback(async () => {
    if (!currentDelegation || !accountAddress) return;

    setClaimStatus('claiming');

    try {
      const networks = useBackendNetworksStore.getState().getDefaultChains();
      const network = networks[currentDelegation.chainId];

      if (!network?.rpcUrls?.default?.http?.[0]) {
        throw new Error(`No RPC URL found for chain ${currentDelegation.chainId}`);
      }

      // Create public client for the specific chain
      const publicClient = createPublicClient({
        transport: http(network.rpcUrls.default.http[0]),
      });

      // Load wallet client
      const walletClient = await loadWalletViem({
        address: accountAddress,
        publicClient,
      });

      if (!walletClient) {
        throw new Error('Failed to load wallet client');
      }

      // Remove the delegation using the existing function
      const txHash = await removeDelegation({
        walletClient,
        publicClient,
      });

      logger.info('Delegation removed successfully', {
        txHash,
        chainId: currentDelegation.chainId,
        contractAddress: currentDelegation.contractAddress,
      });

      haptics.notificationSuccess();
      setClaimStatus('success');

      // Move to next delegation or finish
      setTimeout(() => {
        if (isLastDelegation) {
          goBack();
        } else {
          setCurrentIndex(prev => prev + 1);
          setClaimStatus('ready');
        }
      }, 2000);
    } catch (error) {
      logger.error(new RainbowError('Failed to revoke delegation'), {
        error,
        chainId: currentDelegation.chainId,
        contractAddress: currentDelegation.contractAddress,
      });
      haptics.notificationError();
      setClaimStatus('recoverableError');
    }
  }, [currentDelegation, accountAddress, isLastDelegation, goBack]);

  const buttonLabel = (() => {
    switch (claimStatus) {
      case 'ready':
        return 'Revoke Delegation';
      case 'claiming':
        return 'Revoking...';
      case 'success':
        return isLastDelegation ? 'Done' : 'Next';
      case 'recoverableError':
        return 'Try Again';
      default:
        return 'Revoke Delegation';
    }
  })();

  if (!currentDelegation) {
    return null;
  }

  return (
    <ClaimPanel title="Security Notice" subtitle="Remove delegation from this contract" claimStatus={claimStatus} iconUrl="">
      <Box gap={20} alignItems="center">
        <Box alignItems="center" gap={12}>
          <Text size="17pt" weight="bold" color="label">
            Chain ID: {currentDelegation.chainId}
          </Text>
          <Text size="15pt" color="labelSecondary" align="center">
            {currentDelegation.contractAddress}
          </Text>
          <Text size="13pt" color="labelTertiary" align="center">
            {currentIndex + 1} of {delegationsToRevoke.length}
          </Text>
        </Box>
      </Box>

      <Box alignItems="center" width="full">
        <ClaimButton
          enableHoldToPress={claimStatus === 'ready'}
          isLoading={claimStatus === 'claiming'}
          onPress={
            claimStatus === 'ready' || claimStatus === 'recoverableError'
              ? handleRevoke
              : claimStatus === 'success' && !isLastDelegation
                ? () => {
                    setCurrentIndex(prev => prev + 1);
                    setClaimStatus('ready');
                  }
                : goBack
          }
          disabled={claimStatus === 'claiming'}
          shimmer={claimStatus === 'claiming'}
          biometricIcon={claimStatus === 'ready'}
          label={buttonLabel}
        />
      </Box>
    </ClaimPanel>
  );
};
