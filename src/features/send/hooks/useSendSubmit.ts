import { useCallback } from 'react';
import { InteractionManager } from 'react-native';

import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { useQueryClient } from '@tanstack/react-query';
import { isEmpty } from 'lodash';

import { analytics } from '@/analytics';
import { useRainbowToastEnabled } from '@/components/rainbow-toast/useRainbowToastEnabled';
import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { type ParsedAddressAsset } from '@/entities/tokens';
import { TransactionStatus, type NewTransaction } from '@/entities/transactions';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { isInsufficientSponsorBalanceError } from '@/features/delegation/sponsoredCalls';
import { executeSponsoredSend } from '@/features/delegation/sponsoredSend';
import { executeSponsoredSendIfAvailable } from '@/features/delegation/sponsoredSendExecution';
import type useENSProfile from '@/features/ens/hooks/useENSProfile';
import { type ActionTypes } from '@/features/ens/hooks/useENSRegistrationActionHandler';
import { type REGISTRATION_STEPS } from '@/features/ens/utils/helpers';
import { parseGasParamsForTransaction } from '@/features/gas/utils/parseGas';
import { time } from '@/framework/core/utils/time';
import { isNativeAsset } from '@/handlers/assets';
import {
  assetIsParsedAddressAsset,
  assetIsUniqueAsset,
  createSignableTransaction,
  estimateGasLimit,
  type NewTransactionNonNullable,
} from '@/handlers/web3';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { greaterThan, lessThan } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { ensureError, logger, RainbowError } from '@/logger';
import { loadWallet, sendTransaction } from '@/model/wallet';
import { setHardwareTXError } from '@/navigation/HardwareWalletTxNavigator';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { interactionsCountQueryKey } from '@/resources/addys/interactions';
import { backendNetworksActions, useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { PAGE_SIZE } from '@/state/nfts/createNftsStore';
import { useNftsStore } from '@/state/nfts/nfts';
import { getNextNonce } from '@/state/nonces';
import { addNewTransaction } from '@/state/pendingTransactions';
import { executeFn, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { type Call, type PreparedCallsExecution } from '@rainbow-me/delegation';

type SelectedGasFeeForTx = Parameters<typeof parseGasParamsForTransaction>[0];
type LoadedWallet = NonNullable<Awaited<ReturnType<typeof loadWallet>>>;
type SendSubmitScreen = Screens.SEND | Screens.SEND_ENS;
type SendSubmitTransaction = Partial<Omit<NewTransaction, 'asset'>> & {
  asset: ParsedAddressAsset | UniqueAsset;
};
type SponsoredSendTransaction = Omit<NewTransaction, 'hash' | 'status' | 'txTo' | 'type'>;

type AmountDetails = {
  assetAmount: string;
  isSufficientBalance: boolean;
  nativeAmount: string;
};

type TransferENSAction = ActionTypes[REGISTRATION_STEPS.TRANSFER];
type EnsProfile = ReturnType<typeof useENSProfile>;

type OnSubmitProps = {
  ens?: {
    setAddress: boolean;
    transferControl: boolean;
    clearRecords: boolean;
  };
};

type GasProps = {
  gasLimit: string;
  isSufficientGas: boolean;
  isValidGas: boolean;
  selectedGasFee: SelectedGasFeeForTx;
  updateTxFee: (gasLimit: string | null, l1Fee: unknown) => void;
  updateTxFeeForOptimism: (gasLimit: string) => Promise<void>;
};

type RecipientProps = {
  isValidAddress: boolean;
  recipient: string;
  toAddress: string;
};

type EnsProps = {
  ensName: string | undefined;
  ensProfile: EnsProfile;
  isENS: boolean;
  transferENS: TransferENSAction;
};

type UseSendSubmitParams = {
  accountAddress: string;
  amountDetails: AmountDetails;
  currentChainId: ChainId;
  currentProvider: StaticJsonRpcProvider | undefined;
  ens: EnsProps;
  gas: GasProps;
  isHardwareWallet: boolean;
  isSponsoredSend: boolean;
  nativeCurrency: NativeCurrencyKey;
  recipient: RecipientProps;
  selected: ParsedAddressAsset | UniqueAsset | undefined;
  sponsoredSendPreparedCall: Call | null;
  sponsoredSendPreparedCalls: PreparedCallsExecution | null;
};

type UseSendSubmitResult = {
  submitTransaction: (args?: OnSubmitProps) => Promise<boolean | undefined>;
};

export function useSendSubmit({
  accountAddress,
  amountDetails,
  currentChainId,
  currentProvider,
  ens: { ensName, ensProfile, isENS, transferENS },
  gas: { gasLimit, isSufficientGas, isValidGas, selectedGasFee, updateTxFee, updateTxFeeForOptimism },
  isHardwareWallet,
  isSponsoredSend,
  nativeCurrency,
  recipient: { isValidAddress, recipient, toAddress },
  selected,
  sponsoredSendPreparedCall,
  sponsoredSendPreparedCalls,
}: UseSendSubmitParams): UseSendSubmitResult {
  const queryClient = useQueryClient();
  const { goBack, navigate } = useNavigation();
  const rainbowToastsEnabled = useRainbowToastEnabled();

  const onSubmit = useCallback(
    async ({ ens }: OnSubmitProps = {}) => {
      if (!selected || !currentProvider) return;

      const screen = isENS ? Screens.SEND_ENS : Screens.SEND;
      const selectedAddressAsset = assetIsParsedAddressAsset(selected) ? selected : null;

      const wallet = await executeFn(loadWallet, {
        operation: TimeToSignOperation.KeychainRead,
        screen,
      })({
        provider: currentProvider,
        timeTracking: {
          screen,
          operation: TimeToSignOperation.Authentication,
        },
      });
      if (!wallet) return;

      const currentChainIdNetwork = useBackendNetworksStore.getState().getChainsName()[currentChainId ?? ChainId.mainnet];

      const hasSelectedGasEstimate = Boolean(selectedGasFee?.gasFee?.estimatedFee);
      const hasSufficientGasForSend = isSponsoredSend || isSufficientGas;
      const hasValidGasForSend = isSponsoredSend || isValidGas;
      const validTransaction = isValidAddress && amountDetails.isSufficientBalance && hasSufficientGasForSend && hasValidGasForSend;
      const hasRequiredGasEstimate = isSponsoredSend || hasSelectedGasEstimate;

      if (!hasRequiredGasEstimate || !validTransaction) {
        logger.error(
          new RainbowError(`[useSendSubmit]: preventing tx submit because selectedGasFee is missing or validTransaction is false`),
          {
            selectedGasFee,
            validTransaction,
            isSponsoredSend,
            isValidGas: hasValidGasForSend,
          }
        );
        return false;
      }

      let nextNonce: number | undefined;

      if (isENS && toAddress && (ens?.clearRecords || ens?.setAddress || ens?.transferControl)) {
        const transferENSResult = await transferENS({
          clearRecords: ens.clearRecords,
          name: ensName ?? '',
          records: {
            ...(ensProfile?.data?.contenthash ? { contenthash: ensProfile?.data?.contenthash } : {}),
            ...(ensProfile?.data?.records || {}),
            ...(ensProfile?.data?.coinAddresses || {}),
          },
          setAddress: ens.setAddress,
          toAddress,
          transferControl: ens.transferControl,
          wallet,
        });

        if (!transferENSResult) {
          logger.error(new RainbowError(`[useSendSubmit]: transferENS failed`), {
            transferENSResult,
          });
          return;
        }

        if (typeof transferENSResult.nonce === 'number') {
          nextNonce = transferENSResult.nonce + 1;
        }
      }

      const nonce = nextNonce ?? (await getNextNonce({ address: accountAddress, chainId: currentChainId }));
      const txDetails: SendSubmitTransaction = {
        amount: amountDetails.assetAmount,
        asset: selected,
        network: currentChainIdNetwork,
        chainId: currentChainId,
        from: accountAddress,
        nonce,
        to: toAddress,
      };

      // The interactions count query has a 15-minute cache TTL; without invalidation
      // the recipient's interaction count would stay stale after a send.
      const invalidateInteractionsCount = () => {
        if (!accountAddress || !toAddress || !nativeCurrency) return;

        queryClient.invalidateQueries(
          interactionsCountQueryKey({
            fromAddress: accountAddress.toLowerCase(),
            toAddress: toAddress.toLowerCase(),
            currency: nativeCurrency,
          })
        );
      };

      try {
        if (isSponsoredSend) {
          const didSubmitSponsoredSend = await submitSponsoredSend({
            accountAddress,
            amount: amountDetails.assetAmount,
            chainId: currentChainId,
            chainName: currentChainIdNetwork,
            call: sponsoredSendPreparedCall,
            preparedCalls: sponsoredSendPreparedCalls,
            provider: currentProvider,
            screen,
            selectedAddressAsset,
            signer: wallet,
            toAddress,
          });

          if (didSubmitSponsoredSend) {
            invalidateInteractionsCount();
            return true;
          }

          setSponsoredSendUnavailable({
            chainId: currentChainId,
            error: new RainbowError('[useSendSubmit]: submitSponsoredSend returned false even though sponsored send was selected'),
          });
          return false;
        }

        const didSubmitPaidSend = await submitPaidSend({
          accountAddress,
          amount: amountDetails.assetAmount,
          chainId: currentChainId,
          chainName: currentChainIdNetwork,
          gasLimit,
          provider: currentProvider,
          screen,
          selectedAddressAsset,
          selectedGasFee,
          toAddress,
          txDetails,
          updateTxFee,
          updateTxFeeForOptimism,
          wallet,
        });

        if (didSubmitPaidSend) {
          invalidateInteractionsCount();
        }

        return didSubmitPaidSend;
      } catch (error) {
        const message = ensureError(error).message;
        if (isInsufficientSponsorBalanceError(message) || isSponsoredRelayExecutionFailure(message)) {
          setSponsoredSendUnavailable({
            chainId: currentChainId,
            error,
          });
          return false;
        }

        logger.error(new RainbowError(`[useSendSubmit]: onSubmit error`), {
          txDetails,
          error,
        });

        if (!(wallet instanceof Wallet)) {
          setHardwareTXError(true);
        }
        return false;
      }
    },
    [
      accountAddress,
      amountDetails.assetAmount,
      amountDetails.isSufficientBalance,
      currentChainId,
      currentProvider,
      ensName,
      ensProfile?.data?.coinAddresses,
      ensProfile?.data?.contenthash,
      ensProfile?.data?.records,
      gasLimit,
      isENS,
      isSponsoredSend,
      isSufficientGas,
      isValidAddress,
      isValidGas,
      nativeCurrency,
      queryClient,
      selected,
      sponsoredSendPreparedCall,
      selectedGasFee,
      sponsoredSendPreparedCalls,
      toAddress,
      transferENS,
      updateTxFee,
      updateTxFeeForOptimism,
    ]
  );

  const submitTransaction = useCallback(
    async (args?: OnSubmitProps) => {
      if (!greaterThan(amountDetails.assetAmount, 0)) {
        logger.error(new RainbowError(`[useSendSubmit]: preventing tx submit because amountDetails.assetAmount is <= 0`), {
          amountDetails,
        });
        return false;
      }
      const submitSuccessful = await onSubmit(args);
      analytics.track(analytics.event.sentTransaction, {
        assetName: selected?.name || '',
        network: selected?.network || '',
        chainId: currentChainId,
        isSponsored: isSponsoredSend,
        isRecepientENS: recipient.slice(-4).toLowerCase() === '.eth',
        isHardwareWallet,
        submitSuccessful: submitSuccessful === true,
      });

      const goBackAndNavigate = () => {
        goBack();
        navigate(Routes.WALLET_SCREEN);

        if (!rainbowToastsEnabled) {
          InteractionManager.runAfterInteractions(() => {
            navigate(Routes.PROFILE_SCREEN);
          });
        }
      };

      if (submitSuccessful) {
        if (assetIsUniqueAsset(selected)) {
          const collectionId = `${selected.network}_${selected.contractAddress}`;
          useNftsStore.getState(accountAddress).fetchNftCollection(collectionId, true);
          useNftsStore.getState(accountAddress).fetch({ limit: PAGE_SIZE }, { staleTime: time.seconds(5) });
        }
        executeFn(goBackAndNavigate, {
          screen: isENS ? Screens.SEND_ENS : Screens.SEND,
          operation: TimeToSignOperation.SheetDismissal,
          isEndOfFlow: true,
        })();
      }
    },
    [
      accountAddress,
      amountDetails,
      currentChainId,
      goBack,
      isENS,
      isHardwareWallet,
      isSponsoredSend,
      navigate,
      onSubmit,
      rainbowToastsEnabled,
      recipient,
      selected,
    ]
  );

  return { submitTransaction };
}

function getTransactionAsset(asset: ParsedAddressAsset, network: string): NonNullable<NewTransaction['asset']> {
  return {
    ...asset,
    network: asset.network ?? network,
  };
}

async function submitSponsoredSend({
  accountAddress,
  amount,
  call,
  chainId,
  chainName,
  preparedCalls,
  provider,
  screen,
  selectedAddressAsset,
  signer,
  toAddress,
}: {
  accountAddress: string;
  amount: string;
  call: Call | null;
  chainId: ChainId;
  chainName: string;
  preparedCalls: PreparedCallsExecution | null;
  provider: StaticJsonRpcProvider;
  screen: SendSubmitScreen;
  selectedAddressAsset: ParsedAddressAsset | null;
  signer: LoadedWallet;
  toAddress: string;
}): Promise<boolean> {
  if (!selectedAddressAsset || !call) return false;

  const sponsoredSendTransaction: SponsoredSendTransaction = {
    amount,
    asset: getTransactionAsset(selectedAddressAsset, chainName),
    network: chainName,
    chainId,
    from: accountAddress,
    nonce: -1,
    to: toAddress,
  };

  return executeSponsoredSendIfAvailable({
    accountAddress,
    call,
    chainId,
    executeSponsoredSendWithTracking: executeFn(executeSponsoredSend, {
      screen,
      operation: TimeToSignOperation.BroadcastTransaction,
    }),
    preparedCalls,
    provider,
    signer,
    transaction: sponsoredSendTransaction,
  });
}

function setSponsoredSendUnavailable({ chainId, error }: { chainId: ChainId; error: unknown }) {
  backendNetworksActions.disableSponsorshipUntilNextFetch(chainId);
  logger.error(new RainbowError(`[useSendSubmit]: sponsored send was selected but execution was unavailable`), {
    currentChainId: chainId,
    error,
  });
  Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.failed_transaction), i18n.t(i18n.l.send.sponsorship_unavailable));
}

function isSponsoredRelayExecutionFailure(message: string): boolean {
  return message.includes('Managed relay execution failed') || message.includes('Managed relay execution reverted');
}

async function submitPaidSend({
  accountAddress,
  amount,
  chainId,
  chainName,
  gasLimit,
  provider,
  screen,
  selectedAddressAsset,
  selectedGasFee,
  toAddress,
  txDetails,
  updateTxFee,
  updateTxFeeForOptimism,
  wallet,
}: {
  accountAddress: string;
  amount: string;
  chainId: ChainId;
  chainName: string;
  gasLimit: string;
  provider: StaticJsonRpcProvider;
  screen: SendSubmitScreen;
  selectedAddressAsset: ParsedAddressAsset | null;
  selectedGasFee: SelectedGasFeeForTx;
  toAddress: string;
  txDetails: SendSubmitTransaction;
  updateTxFee: GasProps['updateTxFee'];
  updateTxFeeForOptimism: GasProps['updateTxFeeForOptimism'];
  wallet: LoadedWallet;
}): Promise<boolean | undefined> {
  let updatedGasLimit: string | null = null;
  if (selectedAddressAsset && !isNativeAsset(selectedAddressAsset.address, chainId)) {
    try {
      updatedGasLimit = await estimateGasLimit(
        {
          address: accountAddress,
          amount,
          asset: selectedAddressAsset,
          recipient: toAddress,
        },
        provider,
        chainId,
        true
      );

      if (updatedGasLimit && !lessThan(updatedGasLimit, gasLimit)) {
        if (useBackendNetworksStore.getState().getNeedsL1SecurityFeeChains().includes(chainId)) {
          updateTxFeeForOptimism(updatedGasLimit);
        } else {
          updateTxFee(updatedGasLimit, null);
        }
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }

  const gasLimitToUse = updatedGasLimit && !lessThan(updatedGasLimit, gasLimit) ? updatedGasLimit : gasLimit;
  const gasParams = parseGasParamsForTransaction(selectedGasFee);
  Object.assign(txDetails, {
    gasLimit: gasLimitToUse,
    ...gasParams,
  });

  const signableTransaction = await executeFn(createSignableTransaction, {
    operation: TimeToSignOperation.CreateSignableTransaction,
    screen,
  })(txDetails as NewTransactionNonNullable);
  if (!signableTransaction.to) {
    logger.error(new RainbowError(`[useSendSubmit]: txDetails is missing the "to" field`), {
      txDetails,
      signableTransaction,
    });
    Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.invalid_transaction));
    return false;
  }

  const sendTransactionResult = await executeFn(sendTransaction, {
    screen,
    operation: TimeToSignOperation.BroadcastTransaction,
  })({
    existingWallet: wallet,
    provider,
    transaction: {
      ...signableTransaction,
      to: signableTransaction.to,
      data: signableTransaction.data,
      from: signableTransaction.from,
      gasLimit: signableTransaction.gasLimit,
      chainId: signableTransaction.chainId as ChainId,
      value: signableTransaction.value,
      nonce: signableTransaction.nonce,
    },
  });

  if (!sendTransactionResult || !sendTransactionResult.result) {
    logger.error(new RainbowError(`[useSendSubmit]: No result from sendTransaction`), {
      sendTransactionResult,
      signableTransaction,
    });
    return;
  }

  if (sendTransactionResult?.error) {
    logger.error(new RainbowError(`[useSendSubmit]: Error from sendTransaction`), {
      sendTransactionResult,
      signableTransaction,
    });
    return;
  }

  const { hash, nonce: txNonce } = sendTransactionResult.result;
  const { data, value } = signableTransaction;
  if (!isEmpty(hash)) {
    const pendingTransaction = {
      ...txDetails,
      ...(hash ? { hash } : undefined),
      ...(data ? { data } : undefined),
      ...(value ? { value } : undefined),
      nonce: txNonce,
      network: chainName,
      chainId,
      txTo: signableTransaction.to,
      type: 'send',
      status: TransactionStatus.pending,
    };

    addNewTransaction({
      address: accountAddress,
      chainId,
      transaction: pendingTransaction as NewTransaction,
    });

    return true;
  }

  return false;
}
