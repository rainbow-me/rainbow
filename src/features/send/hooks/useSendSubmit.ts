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
import type useENSProfile from '@/features/ens/hooks/useENSProfile';
import { type ActionTypes } from '@/features/ens/hooks/useENSRegistrationActionHandler';
import { type REGISTRATION_STEPS } from '@/features/ens/utils/helpers';
import { parseGasParamsForTransaction } from '@/features/gas/utils/parseGas';
import { isNativeAsset } from '@/handlers/assets';
import { createSignableTransaction, estimateGasLimit, type NewTransactionNonNullable } from '@/handlers/web3';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { lessThan } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { loadWallet, sendTransaction } from '@/model/wallet';
import { setHardwareTXError } from '@/navigation/HardwareWalletTxNavigator';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { interactionsCountQueryKey } from '@/resources/addys/interactions';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { PAGE_SIZE } from '@/state/nfts/createNftsStore';
import { useNftsStore } from '@/state/nfts/nfts';
import { getNextNonce } from '@/state/nonces';
import { addNewTransaction } from '@/state/pendingTransactions';
import { executeFn, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { time } from '@/utils/time';

type SelectedGasFeeForTx = Parameters<typeof parseGasParamsForTransaction>[0];

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
  isUniqueAsset: boolean;
  nativeCurrency: NativeCurrencyKey;
  recipient: RecipientProps;
  selected: ParsedAddressAsset | UniqueAsset | undefined;
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
  isUniqueAsset,
  nativeCurrency,
  recipient: { isValidAddress, recipient, toAddress },
  selected,
}: UseSendSubmitParams): UseSendSubmitResult {
  const queryClient = useQueryClient();
  const { goBack, navigate } = useNavigation();
  const rainbowToastsEnabled = useRainbowToastEnabled();

  const onSubmit = useCallback(
    async ({ ens }: OnSubmitProps = {}) => {
      if (!selected || !currentProvider) return;

      const screen = isENS ? Screens.SEND_ENS : Screens.SEND;

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

      const validTransaction = isValidAddress && amountDetails.isSufficientBalance && isSufficientGas && isValidGas;
      if (!selectedGasFee?.gasFee?.estimatedFee || !validTransaction) {
        logger.error(
          new RainbowError(`[useSendSubmit]: preventing tx submit because selectedGasFee is missing or validTransaction is false`),
          {
            selectedGasFee,
            validTransaction,
            isValidGas,
          }
        );
        return false;
      }

      let submitSuccess = false;
      let updatedGasLimit: string | null = null;

      if (!isUniqueAsset && selected && !isNativeAsset((selected as ParsedAddressAsset).address, currentChainId)) {
        try {
          updatedGasLimit = await estimateGasLimit(
            {
              address: accountAddress,
              amount: Number(amountDetails.assetAmount),
              asset: selected,
              recipient: toAddress,
            },
            true,
            currentProvider,
            currentChainId
          );

          if (updatedGasLimit && !lessThan(updatedGasLimit, gasLimit)) {
            if (useBackendNetworksStore.getState().getNeedsL1SecurityFeeChains().includes(currentChainId)) {
              updateTxFeeForOptimism(updatedGasLimit);
            } else {
              updateTxFee(updatedGasLimit, null);
            }
          }
          // eslint-disable-next-line no-empty
        } catch (e) {}
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

      const gasLimitToUse = updatedGasLimit && !lessThan(updatedGasLimit, gasLimit) ? updatedGasLimit : gasLimit;
      const gasParams = parseGasParamsForTransaction(selectedGasFee);
      const txDetails: Partial<NewTransaction> = {
        amount: amountDetails.assetAmount,
        asset: selected as ParsedAddressAsset,
        from: accountAddress,
        gasLimit: gasLimitToUse,
        network: currentChainIdNetwork,
        chainId: currentChainId,
        nonce: nextNonce ?? (await getNextNonce({ address: accountAddress, chainId: currentChainId })),
        to: toAddress,
        ...gasParams,
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
          submitSuccess = false;
          return false;
        }

        const sendTransactionResult = await executeFn(sendTransaction, {
          screen,
          operation: TimeToSignOperation.BroadcastTransaction,
        })({
          existingWallet: wallet,
          provider: currentProvider,
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
          submitSuccess = true;
          if (hash) txDetails.hash = hash;
          if (data) txDetails.data = data;
          if (value) txDetails.value = value;
          txDetails.nonce = txNonce;
          txDetails.network = currentChainIdNetwork;
          txDetails.chainId = currentChainId;
          txDetails.txTo = signableTransaction.to;
          txDetails.type = 'send';
          txDetails.status = TransactionStatus.pending;
          addNewTransaction({
            address: accountAddress,
            chainId: currentChainId,
            transaction: txDetails as NewTransaction,
          });

          invalidateInteractionsCount();
        }
      } catch (error) {
        submitSuccess = false;
        logger.error(new RainbowError(`[useSendSubmit]: onSubmit error`), {
          txDetails,
          error,
        });

        if (!(wallet instanceof Wallet)) {
          setHardwareTXError(true);
        }
      }
      return submitSuccess;
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
      isSufficientGas,
      isUniqueAsset,
      isValidAddress,
      isValidGas,
      nativeCurrency,
      queryClient,
      selected,
      selectedGasFee,
      toAddress,
      transferENS,
      updateTxFee,
      updateTxFeeForOptimism,
    ]
  );

  const submitTransaction = useCallback(
    async (args?: OnSubmitProps) => {
      if (Number(amountDetails.assetAmount) <= 0) {
        logger.error(new RainbowError(`[useSendSubmit]: preventing tx submit because amountDetails.assetAmount is <= 0`), {
          amountDetails,
        });
        return false;
      }
      const submitSuccessful = await onSubmit(args);
      analytics.track(analytics.event.sentTransaction, {
        assetName: selected?.name || '',
        network: selected?.network || '',
        isRecepientENS: recipient.slice(-4).toLowerCase() === '.eth',
        isHardwareWallet,
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
        if (isUniqueAsset && selected) {
          const uniqueAsset = selected as UniqueAsset;
          const collectionId = `${uniqueAsset.network}_${uniqueAsset.contractAddress}`;
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
      goBack,
      isENS,
      isHardwareWallet,
      isUniqueAsset,
      navigate,
      onSubmit,
      rainbowToastsEnabled,
      recipient,
      selected,
    ]
  );

  return { submitTransaction };
}
