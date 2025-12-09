import React, { useCallback, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Wallet } from '@ethersproject/wallet';
import { useNavigation } from '@/navigation';
import { Box, Text } from '@/design-system';
import { ClaimButton } from '@/screens/claimables/shared/components/ClaimButton';
import { ClaimPanel } from '@/screens/claimables/shared/components/ClaimPanel';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';
import haptics from '@/utils/haptics';
import { executeRevokeDelegation } from '@rainbow-me/delegation';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';

export type RevokeStatus =
  | 'notReady' // preparing the data necessary to revoke
  | 'ready' // ready to revoke state
  | 'claiming' // user has pressed the revoke button (keeping 'claiming' for compatibility with ClaimPanel/ClaimButton)
  | 'pending' // revoke has been submitted but we don't have a tx hash
  | 'success' // revoke has been submitted and we have a tx hash
  | 'recoverableError' // revoke or auth has failed, can try again
  | 'unrecoverableError'; // revoke has failed, unrecoverable error

export const RevokeDelegationPanel = () => {
  const { goBack } = useNavigation();
  const {
    params: { delegationsToRevoke, onSuccess },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.REVOKE_DELEGATION_PANEL>>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revokeStatus, setRevokeStatus] = useState<RevokeStatus>('ready');
  const accountAddress = useWalletsStore(state => state.accountAddress);

  const currentDelegation = delegationsToRevoke[currentIndex];
  const isLastDelegation = currentIndex === delegationsToRevoke.length - 1;

  const handleRevoke = useCallback(async () => {
    if (!currentDelegation || !accountAddress) return;

    setRevokeStatus('claiming');

    try {
      const provider = getProvider({ chainId: currentDelegation.chainId });

      const wallet = await loadWallet({
        address: accountAddress,
        provider,
      });

      if (!wallet) {
        throw new Error('Failed to load wallet');
      }

      // Get current gas prices from provider
      // TODO: use simulation to get the gas prices
      const feeData = await provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas?.toBigInt() ?? 0n;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas?.toBigInt() ?? 0n;

      // Remove the delegation using the SDK function
      const result = await executeRevokeDelegation({
        signer: wallet as Wallet,
        address: accountAddress,
        provider,
        chainId: currentDelegation.chainId,
        transactionOptions: {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit: null,
        },
      });

      logger.info('Delegation removed successfully', {
        hash: result.hash,
        chainId: currentDelegation.chainId,
        contractAddress: currentDelegation.contractAddress,
      });

      haptics.notificationSuccess();
      setRevokeStatus('success');

      // Move to next delegation or finish
      setTimeout(() => {
        if (isLastDelegation) {
          // Call success callback if provided
          onSuccess?.();
          goBack();
        } else {
          setCurrentIndex(prev => prev + 1);
          setRevokeStatus('ready');
        }
      }, 2000);
    } catch (error) {
      logger.error(new RainbowError('Failed to revoke delegation'), {
        error,
        chainId: currentDelegation.chainId,
        contractAddress: currentDelegation.contractAddress,
      });
      haptics.notificationError();
      setRevokeStatus('recoverableError');
    }
  }, [currentDelegation, accountAddress, isLastDelegation, goBack]);

  const buttonLabel = (() => {
    switch (revokeStatus) {
      case 'ready':
        return 'Revoke Delegation';
      case 'claiming': // Transaction is being processed
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
    <ClaimPanel title="Security Notice" subtitle="Remove delegation from this contract" claimStatus={revokeStatus} iconUrl="">
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
          enableHoldToPress={revokeStatus === 'ready'}
          isLoading={revokeStatus === 'claiming'}
          onPress={
            revokeStatus === 'ready' || revokeStatus === 'recoverableError'
              ? handleRevoke
              : revokeStatus === 'success' && !isLastDelegation
                ? () => {
                    setCurrentIndex(prev => prev + 1);
                    setRevokeStatus('ready');
                  }
                : goBack
          }
          disabled={revokeStatus === 'claiming'}
          shimmer={revokeStatus === 'claiming'}
          biometricIcon={revokeStatus === 'ready'}
          label={buttonLabel}
        />
      </Box>
    </ClaimPanel>
  );
};
