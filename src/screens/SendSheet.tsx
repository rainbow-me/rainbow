import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Keyboard, Platform, View, type TextInput } from 'react-native';

import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { isEmpty, isEqual, isString } from 'lodash';
import { useDebounce } from 'use-debounce';

import { analytics } from '@/analytics';
import { NoResults } from '@/components/list';
import { NoResultsType } from '@/components/list/NoResults';
import { useRainbowToastEnabled } from '@/components/rainbow-toast/useRainbowToastEnabled';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { AssetType } from '@/entities/assetTypes';
import { type ParsedAddressAsset } from '@/entities/tokens';
import { TransactionStatus, type NewTransaction } from '@/entities/transactions';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { isInsufficientSponsorBalanceError } from '@/features/delegation/sponsoredCalls';
import { buildSendCall, executeSponsoredSend } from '@/features/delegation/sponsoredSend';
import { buildSendCallFromSendDetails, executeSponsoredSendIfAvailable } from '@/features/delegation/sponsoredSendExecution';
import { useSponsoredSendPreparation } from '@/features/delegation/ui/hooks/useSponsoredSendPreparation';
import { prefetchENSAvatar } from '@/features/ens/hooks/useENSAvatar';
import { prefetchENSCover } from '@/features/ens/hooks/useENSCover';
import useENSProfile from '@/features/ens/hooks/useENSProfile';
import useENSRegistrationActionHandler from '@/features/ens/hooks/useENSRegistrationActionHandler';
import { debouncedFetchSuggestions } from '@/features/ens/utils/handlers';
import { REGISTRATION_STEPS } from '@/features/ens/utils/helpers';
import GasSpeedButton from '@/features/gas/components/GasSpeedButton';
import useGas from '@/features/gas/hooks/useGas';
import { parseGasParamsForTransaction } from '@/features/gas/utils/parseGas';
import styled from '@/framework/ui/styled-thing';
import { isNativeAsset } from '@/handlers/assets';
import {
  assetIsUniqueAsset,
  buildTransaction,
  createSignableTransaction,
  estimateGasLimit,
  getProvider,
  isL2Chain,
  resolveNameOrAddress,
  type NewTransactionNonNullable,
} from '@/handlers/web3';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { convertAmountAndPriceToNativeDisplay, convertAmountFromNativeValue, formatInputDecimals, lessThan } from '@/helpers/utilities';
import { checkIsValidAddressOrDomain, checkIsValidAddressOrDomainFormat, isENSAddressFormat } from '@/helpers/validators';
import useAccountSettings from '@/hooks/useAccountSettings';
import useCoinListEditOptions from '@/hooks/useCoinListEditOptions';
import useColorForAsset from '@/hooks/useColorForAsset';
import useContacts from '@/hooks/useContacts';
import useMaxInputBalance from '@/hooks/useMaxInputBalance';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import usePrevious from '@/hooks/usePrevious';
import useSendableUniqueTokens from '@/hooks/useSendableUniqueTokens';
import useSendSheetInputRefs from '@/hooks/useSendSheetInputRefs';
import useUserAccounts from '@/hooks/useUserAccounts';
import * as i18n from '@/languages';
import { ensureError, logger, RainbowError } from '@/logger';
import { loadWallet, sendTransaction } from '@/model/wallet';
import { setHardwareTXError } from '@/navigation/HardwareWalletTxNavigator';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { type Contact } from '@/redux/contacts';
import { rainbowTokenList } from '@/references/rainbow-token-list';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { backendNetworksActions, useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { PAGE_SIZE } from '@/state/nfts/createNftsStore';
import { useNftsStore } from '@/state/nfts/nfts';
import { getNextNonce } from '@/state/nonces';
import { addNewTransaction } from '@/state/pendingTransactions';
import { executeFn, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { getWallets, useAccountAddress, useIsHardwareWallet } from '@/state/wallets/walletsStore';
import { borders } from '@/styles';
import { useTheme, type ThemeContextProps } from '@/theme/ThemeContext';
import deviceUtils from '@/utils/deviceUtils';
import ethereumUtils from '@/utils/ethereumUtils';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';
import { time } from '@/utils/time';

import { Column } from '../components/layout';
import { SendAssetForm, SendAssetList, SendContactList, SendHeader } from '../components/send';
import { SheetActionButton } from '../components/sheet';
import { getDefaultCheckboxes } from './SendConfirmationSheet';
import {
  buildBaseSendTransactionDetails,
  getSendSubmitButtonState,
  getSendSubmitEligibility,
  invalidateSendInteractionsCount,
} from './sendSheetUtils';

const sheetHeight = deviceUtils.dimensions.height - (Platform.OS === 'android' ? 30 : 10);

type ComponentPropsWithTheme = {
  theme: ThemeContextProps;
};

const Container = styled(View)({
  backgroundColor: ({ theme: { colors } }: ComponentPropsWithTheme) => colors.transparent,
  flex: 1,
  paddingTop: Platform.OS === 'ios' ? 0 : safeAreaInsetValues.top,
  width: '100%',
});

const SheetContainer = styled(Column).attrs({
  align: 'center',
  flex: 1,
})({
  ...borders.buildRadiusAsObject('top', Platform.OS === 'ios' ? 0 : 16),
  backgroundColor: ({ theme: { colors } }: ComponentPropsWithTheme) => colors.white,
  height: sheetHeight,
  width: '100%',
});

const validateRecipient = (toAddress?: string, tokenAddress?: string) => {
  if (!toAddress || toAddress?.toLowerCase() === tokenAddress?.toLowerCase()) {
    return false;
  }

  // Don't allow send to known ERC20 contracts on mainnet
  if (rainbowTokenList.RAINBOW_TOKEN_LIST[toAddress.toLowerCase()]) {
    return false;
  }
  return true;
};

const validateRecipientDamagedState = (toAddress?: string) => {
  const wallets = getWallets();
  // check for if the recipient is in a damaged wallet state and prevent
  if (wallets) {
    const internalWallet = Object.values(wallets).find(wallet =>
      wallet.addresses.some(address => isLowerCaseMatch(address.address, toAddress))
    );
    if (internalWallet?.damaged) {
      return false;
    }
  }
  return true;
};

type OnSubmitProps = {
  ens?: {
    setAddress: boolean;
    transferControl: boolean;
    clearRecords: boolean;
  };
};

export default function SendSheet() {
  const { goBack, navigate } = useNavigation();
  const sortedAssets = useUserAssetsStore(state => state.legacyUserAssets);
  const isLoadingUserAssets = useUserAssetsStore(state => state.getStatus('isInitialLoad'));
  const {
    gasFeeParamsBySpeed,
    gasLimit,
    isSufficientGas,
    isValidGas,
    selectedGasFee,
    startPollingGasFees,
    stopPollingGasFees,
    updateDefaultGasLimit,
    updateTxFee,
    l1GasFeeOptimism,
  } = useGas({ enableTracking: true });
  const recipientFieldRef = useRef<TextInput | null>(null);
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const { contacts, onRemoveContact, filteredContacts } = useContacts();
  const { userAccounts, watchedAccounts } = useUserAccounts();
  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const { nativeCurrency, chainId } = useAccountSettings();
  const accountAddress = useAccountAddress();
  const isHardwareWallet = useIsHardwareWallet();
  const queryClient = useQueryClient();

  const { action: transferENS } = useENSRegistrationActionHandler({
    step: REGISTRATION_STEPS.TRANSFER,
  });

  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);
  const { pinnedCoinsObj } = useCoinListEditOptions();
  const [toAddress, setToAddress] = useState<string>('');
  const [amountDetails, setAmountDetails] = useState({
    assetAmount: '',
    isSufficientBalance: false,
    nativeAmount: '',
  });
  const [currentChainId, setCurrentChainId] = useState<ChainId>(ChainId.mainnet);
  const prevChainId = usePrevious(currentChainId);
  const [currentInput, setCurrentInput] = useState('');

  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.SEND_SHEET>>();
  const assetOverride = params?.asset;
  const prevAssetOverride = usePrevious(assetOverride);

  const recipientOverride = params?.address;
  const nativeAmountOverride = params?.nativeAmount;
  const [recipient, setRecipient] = useState('');
  const [nickname, setNickname] = useState('');
  const [selected, setSelected] = useState<ParsedAddressAsset | UniqueAsset | undefined>();
  const [maxEnabled, setMaxEnabled] = useState(false);

  const [debouncedInput] = useDebounce(currentInput, 500);
  const [debouncedRecipient] = useDebounce(recipient, 500);
  const [debouncedAssetAmount] = useDebounce(amountDetails.assetAmount, 500);

  const [isValidAddress, setIsValidAddress] = useState(!!recipientOverride);
  const [currentProvider, setCurrentProvider] = useState<StaticJsonRpcProvider | undefined>(getProvider({ chainId: ChainId.mainnet }));
  const theme = useTheme();
  const { colors, isDarkMode } = theme;

  const { nativeCurrencyInputRef, setLastFocusedInputHandle, assetInputRef } = useSendSheetInputRefs();

  const showEmptyState = !isValidAddress;
  const showAssetList = isValidAddress && isEmpty(selected);
  const showAssetForm = isValidAddress && !isEmpty(selected);

  const isUniqueAsset = assetIsUniqueAsset(selected);
  const isENS = selected?.type === AssetType.ens;
  const {
    canUseSponsoredSend,
    hasResolvedSponsoredSend,
    isPreparingSponsoredSend,
    isSponsoredSend,
    preparedCalls: sponsoredSendPreparedCalls,
    shouldShowSponsoredSendGas,
  } = useSponsoredSendPreparation({
    accountAddress,
    amount: amountDetails.assetAmount,
    chainId: currentChainId,
    debouncedAmount: debouncedAssetAmount,
    isENS,
    isValidAddress,
    provider: currentProvider,
    selected,
    toAddress,
  });
  const { maxInputBalance, updateMaxInputBalance } = useMaxInputBalance({ ignoreGasFee: shouldShowSponsoredSendGas });

  let colorForAsset = useColorForAsset(selected, undefined, false, true);
  const uniqueAssetColor = usePersistentDominantColorFromImage(isUniqueAsset ? selected?.images.lowResUrl : null) ?? colors.appleBlue;
  if (isUniqueAsset) {
    colorForAsset = uniqueAssetColor;
  }

  const ensName = isENS ? selected?.name : '';
  const ensProfile = useENSProfile(ensName, {
    enabled: isENS,
    supportedRecordsOnly: false,
  });

  const isL2 = useMemo(() => {
    return isL2Chain({ chainId: currentChainId });
  }, [currentChainId]);

  const sendUpdateAssetAmount = useCallback(
    (newAssetAmount: string) => {
      const _assetAmount = newAssetAmount.replace(/[^0-9.]/g, '');
      let _nativeAmount = '';
      if (_assetAmount.length) {
        const priceUnit = !isUniqueAsset ? (selected?.price?.value ?? 0) : (selected?.floorPrice ?? 0);
        const { amount: convertedNativeAmount } = convertAmountAndPriceToNativeDisplay(_assetAmount, priceUnit, nativeCurrency);
        _nativeAmount = formatInputDecimals(convertedNativeAmount, _assetAmount);
      }

      const _isSufficientBalance = Number(_assetAmount) <= Number(maxInputBalance);

      setAmountDetails({
        assetAmount: _assetAmount,
        isSufficientBalance: _isSufficientBalance,
        nativeAmount: _nativeAmount,
      });
    },
    [isUniqueAsset, maxInputBalance, nativeCurrency, selected]
  );

  const sendUpdateSelected = useCallback(
    (newSelected: ParsedAddressAsset | UniqueAsset | undefined) => {
      if (isEqual(newSelected, selected)) return;
      updateMaxInputBalance(newSelected);
      if (assetIsUniqueAsset(newSelected)) {
        setAmountDetails({
          assetAmount: '1',
          isSufficientBalance: true,
          nativeAmount: '0',
        });

        if (selected?.uniqueId !== newSelected?.uniqueId) {
          setSelected({
            ...newSelected,
            symbol: newSelected.collectionName ?? undefined,
          });
        }
      } else {
        setSelected(newSelected);
        sendUpdateAssetAmount('');
      }
    },
    [selected, sendUpdateAssetAmount, updateMaxInputBalance]
  );

  useEffect(() => {
    if (!selected || isUniqueAsset) return;

    const newMaxInputBalance = updateMaxInputBalance(selected);
    setAmountDetails(currentAmountDetails => {
      const isSufficientBalance = Number(currentAmountDetails.assetAmount) <= Number(newMaxInputBalance);
      if (currentAmountDetails.isSufficientBalance === isSufficientBalance) return currentAmountDetails;

      return {
        ...currentAmountDetails,
        isSufficientBalance,
      };
    });
  }, [isUniqueAsset, selected, shouldShowSponsoredSendGas, updateMaxInputBalance]);

  // Update all fields passed via params if needed
  useEffect(() => {
    if (recipientOverride && !recipient) {
      setIsValidAddress(true);
      setRecipient(recipientOverride);
    }

    if (assetOverride && assetOverride !== prevAssetOverride) {
      sendUpdateSelected(assetOverride);
      updateMaxInputBalance(assetOverride);
    }

    if (nativeAmountOverride && maxInputBalance) {
      sendUpdateAssetAmount(nativeAmountOverride);
    }
  }, [
    amountDetails,
    assetOverride,
    maxInputBalance,
    nativeAmountOverride,
    prevAssetOverride,
    recipient,
    recipientOverride,
    sendUpdateAssetAmount,
    sendUpdateSelected,
    updateMaxInputBalance,
  ]);

  useEffect(() => {
    // We can start fetching gas prices
    // after we know the network that the asset
    // belongs to
    if (prevChainId !== currentChainId) {
      InteractionManager.runAfterInteractions(() => {
        startPollingGasFees(currentChainId);
      });
    }
  }, [startPollingGasFees, prevChainId, currentChainId]);

  // Stop polling when the sheet is unmounted
  useEffect(() => {
    return () => {
      InteractionManager.runAfterInteractions(() => {
        stopPollingGasFees();
      });
    };
  }, [currentChainId, stopPollingGasFees]);

  useEffect(() => {
    const assetChainId = selected?.chainId;
    if (assetChainId && (assetChainId !== currentChainId || !currentChainId || prevChainId !== currentChainId)) {
      if (chainId === ChainId.goerli) {
        setCurrentChainId(ChainId.goerli);
        const provider = getProvider({ chainId: ChainId.goerli });
        setCurrentProvider(provider);
      } else {
        setCurrentChainId(assetChainId);
        const provider = getProvider({ chainId: currentChainId });
        setCurrentProvider(provider);
      }
    }
  }, [currentChainId, chainId, prevChainId, selected?.chainId]);

  const onChangeNativeAmount = useCallback(
    (newNativeAmount: string) => {
      if (!isString(newNativeAmount)) return;
      if (maxEnabled) {
        setMaxEnabled(false);
      }
      const _nativeAmount = newNativeAmount.replace(/[^0-9.]/g, '');
      let _assetAmount = '';
      if (_nativeAmount.length) {
        const priceUnit = !isUniqueAsset ? (selected?.price?.value ?? 0) : 0;
        const decimals = !isUniqueAsset ? (typeof selected?.decimals === 'number' ? selected.decimals : 18) : 0;
        const convertedAssetAmount = convertAmountFromNativeValue(_nativeAmount, priceUnit, decimals);
        _assetAmount = formatInputDecimals(convertedAssetAmount, _nativeAmount);
      }

      const _isSufficientBalance = Number(_assetAmount) <= Number(maxInputBalance);
      setAmountDetails({
        assetAmount: _assetAmount,
        isSufficientBalance: _isSufficientBalance,
        nativeAmount: _nativeAmount,
      });
      analytics.track(analytics.event.changedNativeCurrencyInputSend);
    },
    [maxEnabled, maxInputBalance, isUniqueAsset, selected]
  );

  useEffect(() => {
    if (maxEnabled) {
      const newBalanceAmount = updateMaxInputBalance(selected);
      sendUpdateAssetAmount(newBalanceAmount);
    }
    // we want to listen to the gas fee and update when it changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, sendUpdateAssetAmount, updateMaxInputBalance, selectedGasFee, maxEnabled]);

  const onChangeAssetAmount = useCallback(
    (newAssetAmount: string) => {
      if (isString(newAssetAmount)) {
        if (maxEnabled) {
          setMaxEnabled(false);
        }
        sendUpdateAssetAmount(newAssetAmount);
        analytics.track(analytics.event.changedTokenInputSend);
      }
    },
    [maxEnabled, sendUpdateAssetAmount]
  );

  useEffect(() => {
    const resolveAddressIfNeeded = async () => {
      const isValid = checkIsValidAddressOrDomainFormat(debouncedRecipient);
      if (isValid) {
        const resolvedAddress = await resolveNameOrAddress(debouncedRecipient);
        if (resolvedAddress && typeof resolvedAddress === 'string') {
          setToAddress(resolvedAddress);
        } else {
          setIsValidAddress(false);
        }
      } else {
        setIsValidAddress(false);
      }
    };
    debouncedRecipient && resolveAddressIfNeeded();
  }, [debouncedRecipient]);

  const updateTxFeeForOptimism = useCallback(
    async (updatedGasLimit: string) => {
      if (!selected || !currentProvider) return;

      const txData = await buildTransaction(
        {
          address: accountAddress,
          amount: Number(amountDetails.assetAmount),
          asset: selected as ParsedAddressAsset,
          gasLimit: updatedGasLimit,
          recipient: toAddress,
        },
        currentProvider,
        currentChainId
      );
      const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(txData, currentProvider);
      updateTxFee(updatedGasLimit, null, l1GasFeeOptimism);
    },
    [accountAddress, amountDetails.assetAmount, currentChainId, currentProvider, selected, toAddress, updateTxFee]
  );

  const onSubmit = useCallback(
    async ({ ens }: OnSubmitProps = {}) => {
      if (!selected || !currentProvider) return;

      const wallet = await executeFn(loadWallet, {
        operation: TimeToSignOperation.KeychainRead,
        screen: isENS ? Screens.SEND_ENS : Screens.SEND,
      })({
        provider: currentProvider,
        timeTracking: {
          screen: isENS ? Screens.SEND_ENS : Screens.SEND,
          operation: TimeToSignOperation.Authentication,
        },
      });
      if (!wallet) return;

      const currentChainIdNetwork = useBackendNetworksStore.getState().getChainsName()[currentChainId ?? ChainId.mainnet];

      const submitEligibility = getSendSubmitEligibility({
        hasSelectedGasEstimate: Boolean(selectedGasFee?.gasFee?.estimatedFee),
        isSponsoredSend,
        isSufficientBalance: amountDetails.isSufficientBalance,
        isSufficientGas,
        isValidAddress,
        isValidGas,
      });
      if (!submitEligibility.hasRequiredGasEstimate || !submitEligibility.validTransaction) {
        logger.error(new RainbowError(`[SendSheet]: preventing tx submit because selectedGasFee is missing or validTransaction is false`), {
          selectedGasFee,
          validTransaction: submitEligibility.validTransaction,
          isSponsoredSend,
          isValidGas: submitEligibility.hasValidGasForSend,
        });
        return false;
      }

      let submitSuccess = false;
      let updatedGasLimit = null;

      // Attempt to update gas limit before sending ERC20 / ERC721
      if (!isSponsoredSend && !isUniqueAsset && selected && !isNativeAsset(selected.address, currentChainId)) {
        try {
          // Estimate the tx with gas limit padding before sending
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

      let nextNonce;

      if (isENS && toAddress && (ens?.clearRecords || ens?.setAddress || ens?.transferControl)) {
        const transferENSResult = await transferENS({
          clearRecords: ens.clearRecords,
          name: ensName,
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
          logger.error(new RainbowError(`[SendSheet]: transferENS failed`), {
            transferENSResult,
          });
          return;
        }

        if (typeof transferENSResult.nonce === 'number') {
          nextNonce = transferENSResult.nonce + 1;
        }
      }

      const nonce = nextNonce ?? (await getNextNonce({ address: accountAddress, chainId: currentChainId }));
      const txDetails = buildBaseSendTransactionDetails({
        amount: amountDetails.assetAmount,
        asset: selected,
        network: currentChainIdNetwork,
        chainId: currentChainId,
        from: accountAddress,
        nonce,
        to: toAddress,
      });

      const invalidateInteractionsCount = () => {
        invalidateSendInteractionsCount({ accountAddress, nativeCurrency, queryClient, toAddress });
      };
      try {
        if (isSponsoredSend && sponsoredSendPreparedCalls) {
          const sendCall = await buildSendCallFromSendDetails({
            accountAddress,
            amount: amountDetails.assetAmount,
            asset: selected,
            chainId: currentChainId,
            provider: currentProvider,
            toAddress,
          });
          const didExecuteSponsoredSend = await executeSponsoredSendIfAvailable({
            accountAddress,
            call: sendCall,
            canPrepareSponsoredSend: false,
            chainId: currentChainId,
            executeSponsoredSendWithTracking: executeFn(executeSponsoredSend, {
              screen: isENS ? Screens.SEND_ENS : Screens.SEND,
              operation: TimeToSignOperation.BroadcastTransaction,
            }),
            preparedCalls: sponsoredSendPreparedCalls,
            provider: currentProvider,
            signer: wallet,
            transaction: txDetails,
          });

          if (didExecuteSponsoredSend) {
            submitSuccess = true;
            invalidateInteractionsCount();
            return submitSuccess;
          }
        }

        const gasLimitToUse = updatedGasLimit && !lessThan(updatedGasLimit, gasLimit) ? updatedGasLimit : gasLimit;
        const gasParams = parseGasParamsForTransaction(selectedGasFee);
        Object.assign(txDetails, {
          gasLimit: gasLimitToUse,
          ...gasParams,
        });

        const signableTransaction = await executeFn(createSignableTransaction, {
          operation: TimeToSignOperation.CreateSignableTransaction,
          screen: isENS ? Screens.SEND_ENS : Screens.SEND,
        })(txDetails as NewTransactionNonNullable);
        if (!signableTransaction.to) {
          logger.error(new RainbowError(`[SendSheet]: txDetails is missing the "to" field`), {
            txDetails,
            signableTransaction,
          });
          Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.invalid_transaction));
          submitSuccess = false;
        } else {
          const sendCall = buildSendCall(signableTransaction);
          const didExecuteSponsoredSend = await executeSponsoredSendIfAvailable({
            accountAddress,
            call: sendCall,
            canPrepareSponsoredSend: canUseSponsoredSend,
            chainId: currentChainId,
            executeSponsoredSendWithTracking: executeFn(executeSponsoredSend, {
              screen: isENS ? Screens.SEND_ENS : Screens.SEND,
              operation: TimeToSignOperation.BroadcastTransaction,
            }),
            preparedCalls: sponsoredSendPreparedCalls,
            provider: currentProvider,
            signer: wallet,
            transaction: txDetails,
          });

          if (didExecuteSponsoredSend) {
            submitSuccess = true;
            invalidateInteractionsCount();
            return submitSuccess;
          }

          const sendTransactionResult = await executeFn(sendTransaction, {
            screen: isENS ? Screens.SEND_ENS : Screens.SEND,
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
            logger.error(new RainbowError(`[SendSheet]: No result from sendTransaction`), {
              sendTransactionResult,
              signableTransaction,
            });
            return;
          }

          if (sendTransactionResult?.error) {
            logger.error(new RainbowError(`[SendSheet]: Error from sendTransaction`), {
              sendTransactionResult,
              signableTransaction,
            });
            return;
          }

          const { hash, nonce } = sendTransactionResult.result;
          const { data, value } = signableTransaction;
          if (!isEmpty(hash)) {
            submitSuccess = true;

            if (hash) {
              txDetails.hash = hash;
            }

            if (data) {
              txDetails.data = data;
            }

            if (value) {
              txDetails.value = value;
            }

            txDetails.nonce = nonce;
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
        }
      } catch (error) {
        submitSuccess = false;
        const message = ensureError(error).message;
        if (isInsufficientSponsorBalanceError(message)) {
          backendNetworksActions.disableSponsorshipUntilNextFetch(currentChainId);
          Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.failed_transaction), i18n.t(i18n.l.swap.sponsorship_unavailable));
          return false;
        }

        logger.error(new RainbowError(`[SendSheet]: onSubmit error`), {
          txDetails,
          error,
        });

        // if hardware wallet, we need to tell hardware flow there was error
        // have to check inverse or we trigger unwanted BT permissions requests
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
      canUseSponsoredSend,
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
      isUniqueAsset,
      isValidAddress,
      isValidGas,
      selected,
      selectedGasFee,
      toAddress,
      transferENS,
      updateTxFee,
      updateTxFeeForOptimism,
      queryClient,
      nativeCurrency,
      sponsoredSendPreparedCalls,
    ]
  );

  const rainbowToastsEnabled = useRainbowToastEnabled();

  const submitTransaction = useCallback(
    async (args?: OnSubmitProps) => {
      if (Number(amountDetails.assetAmount) <= 0) {
        logger.error(new RainbowError(`[SendSheet]: preventing tx submit because amountDetails.assetAmount is <= 0`), {
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

        // with toasts: just show the toast
        // without toasts: navigate user to the activity list
        if (!rainbowToastsEnabled) {
          InteractionManager.runAfterInteractions(() => {
            navigate(Routes.PROFILE_SCREEN);
          });
        }
      };

      if (submitSuccessful) {
        // if the user sent an NFT, we need to revalidate the NFT data
        if (isUniqueAsset) {
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

  const { buttonDisabled, buttonLabel } = useMemo(() => {
    const isGasFeeReady =
      !isEmpty(gasFeeParamsBySpeed) &&
      Boolean(selectedGasFee) &&
      !isEmpty(selectedGasFee?.gasFee) &&
      Boolean(toAddress) &&
      (!useBackendNetworksStore.getState().getNeedsL1SecurityFeeChains().includes(currentChainId) || l1GasFeeOptimism !== null);

    return getSendSubmitButtonState({
      assetAmount: amountDetails.assetAmount,
      canUseSponsoredSend,
      hasResolvedSponsoredSend,
      isENS,
      isENSProfileLoaded: ensProfile.isSuccess,
      isGasFeeReady,
      isPreparingSponsoredSend,
      isSponsoredSend,
      isSufficientBalance: amountDetails.isSufficientBalance,
      isSufficientGas,
      isValidGas,
      nativeAssetSymbol: useBackendNetworksStore.getState().getChainsNativeAsset()[currentChainId || ChainId.mainnet]?.symbol,
      sponsoredAmountIsStale: debouncedAssetAmount !== amountDetails.assetAmount,
    });
  }, [
    amountDetails.assetAmount,
    amountDetails.isSufficientBalance,
    canUseSponsoredSend,
    debouncedAssetAmount,
    isENS,
    ensProfile.isSuccess,
    gasFeeParamsBySpeed,
    selectedGasFee,
    toAddress,
    currentChainId,
    l1GasFeeOptimism,
    hasResolvedSponsoredSend,
    isPreparingSponsoredSend,
    isSponsoredSend,
    isSufficientGas,
    isValidGas,
  ]);

  const showConfirmationSheet = useCallback(async () => {
    if (buttonDisabled || !selected) return;
    let toAddress = recipient;
    const isValid = await checkIsValidAddressOrDomain(recipient);
    if (isValid) {
      const resolvedAddress = await resolveNameOrAddress(recipient);
      if (resolvedAddress && typeof resolvedAddress === 'string') {
        toAddress = resolvedAddress;
      }
    }
    const tokenAddress = !isUniqueAsset ? selected?.address : undefined;
    const validRecipient = validateRecipient(toAddress, tokenAddress);
    assetInputRef?.current?.blur();
    nativeCurrencyInputRef?.current?.blur();
    if (!validRecipient) {
      navigate(Routes.EXPLAIN_SHEET, {
        onClose: () => {
          // Nasty workaround to take control over useMagicAutofocus :S
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              recipientFieldRef?.current?.focus();
            }, 210);
          });
        },
        type: 'sending_funds_to_contract',
      });
      return;
    }
    const validRecipientDamagedState = validateRecipientDamagedState(toAddress);
    if (!validRecipientDamagedState) {
      navigate(Routes.WALLET_ERROR_SHEET);
      return;
    }
    const checkboxes = getDefaultCheckboxes({
      ensProfile,
      isENS,
      chainId,
      toAddress: recipient,
    });
    navigate(Routes.SEND_CONFIRMATION_SHEET, {
      amountDetails: amountDetails,
      asset: selected,
      callback: submitTransaction,
      checkboxes,
      ensProfile,
      isENS,
      isL2,
      isSponsored: isSponsoredSend,
      isUniqueAsset,
      chainId: currentChainId,
      profilesEnabled,
      to: recipient,
      toAddress,
    });
  }, [
    buttonDisabled,
    selected,
    recipient,
    isUniqueAsset,
    assetInputRef,
    nativeCurrencyInputRef,
    ensProfile,
    isENS,
    chainId,
    navigate,
    amountDetails,
    submitTransaction,
    isL2,
    isSponsoredSend,
    currentChainId,
    profilesEnabled,
  ]);

  const onResetAssetSelection = useCallback(() => {
    analytics.track(analytics.event.resetAssetSelectionSend);
    sendUpdateSelected(undefined);
    setMaxEnabled(false);
  }, [sendUpdateSelected]);

  const onChangeInput = useCallback(
    (text: string) => {
      const isValid = checkIsValidAddressOrDomainFormat(text);
      if (!isValid) {
        setIsValidAddress(false);
        setToAddress('');
      }
      setCurrentInput(text);
      setRecipient(text);
      setNickname(text);
      if (profilesEnabled && isENSAddressFormat(text)) {
        prefetchENSAvatar(text);
        prefetchENSCover(text);
      }
    },
    [profilesEnabled]
  );

  useEffect(() => {
    updateDefaultGasLimit();
  }, [updateDefaultGasLimit]);

  useEffect(() => {
    if ((isValidAddress && showAssetList) || (isValidAddress && showAssetForm && assetIsUniqueAsset(selected))) {
      Keyboard.dismiss();
    }
  }, [isValidAddress, selected, showAssetForm, showAssetList]);

  const checkAddress = useCallback((recipient: string) => {
    if (recipient) {
      const isValidFormat = checkIsValidAddressOrDomainFormat(recipient);
      setIsValidAddress(isValidFormat);
    }
  }, []);

  const [ensSuggestions, setEnsSuggestions] = useState<Contact[]>([]);
  const [loadingEnsSuggestions, setLoadingEnsSuggestions] = useState(false);
  useEffect(() => {
    if (chainId === ChainId.mainnet && !recipientOverride && recipient?.length) {
      setLoadingEnsSuggestions(true);
      debouncedFetchSuggestions(recipient, setEnsSuggestions, setLoadingEnsSuggestions, profilesEnabled);
    }
  }, [chainId, recipient, recipientOverride, setEnsSuggestions, watchedAccounts, profilesEnabled]);

  useEffect(() => {
    checkAddress(debouncedInput);
  }, [checkAddress, debouncedInput]);

  useEffect(() => {
    if (!currentProvider?._network?.chainId) return;

    const assetChainId = selected?.chainId;
    const currentProviderChainId = currentProvider._network.chainId;

    if (
      selected &&
      !!accountAddress &&
      !shouldShowSponsoredSendGas &&
      Number(amountDetails.assetAmount) > 0 &&
      assetChainId === currentChainId &&
      currentProviderChainId === currentChainId &&
      toAddress &&
      isValidAddress &&
      !isEmpty(selected)
    ) {
      estimateGasLimit(
        {
          address: accountAddress,
          amount: Number(amountDetails.assetAmount),
          asset: selected as ParsedAddressAsset,
          recipient: toAddress,
        },
        false,
        currentProvider,
        currentChainId
      )
        .then(async gasLimit => {
          if (gasLimit && useBackendNetworksStore.getState().getNeedsL1SecurityFeeChains().includes(currentChainId)) {
            updateTxFeeForOptimism(gasLimit);
          } else {
            updateTxFee(gasLimit, null);
          }
        })
        .catch(e => {
          logger.error(new RainbowError(`[SendSheet]: error calculating gas limit: ${e}`));
          updateTxFee(null, null);
        });
    }
  }, [
    accountAddress,
    amountDetails.assetAmount,
    currentProvider,
    isValidAddress,
    recipient,
    selected,
    shouldShowSponsoredSendGas,
    toAddress,
    updateTxFee,
    updateTxFeeForOptimism,
    chainId,
    currentChainId,
    isUniqueAsset,
  ]);

  useEffect(() => {
    if (isLoadingUserAssets || !sortedAssets) return;
    const params = { screen: 'send' as const, no_icon: 0, no_price: 0, total_tokens: sortedAssets.length };
    for (const asset of sortedAssets) {
      if (!asset.icon_url) params.no_icon += 1;
      if (!asset.price?.relative_change_24h) params.no_price += 1;
    }
    analytics.track(analytics.event.tokenList, params);
  }, [isLoadingUserAssets, sortedAssets]);

  const sendContactListDataKey = useMemo(() => `${ensSuggestions?.[0]?.address || '_'}`, [ensSuggestions]);

  const isEmptyWallet = !sortedAssets?.length && !sendableUniqueTokens?.length;

  const filteredUserAccountsFromContacts = useMemo(() => {
    return userAccounts.filter(
      account => !filteredContacts.some(contact => contact.address.toLowerCase() === account.address.toLowerCase())
    );
  }, [userAccounts, filteredContacts]);

  return (
    <Container testID="send-sheet">
      <SheetContainer>
        <SendHeader
          contacts={contacts}
          fromProfile={params?.fromProfile}
          hideDivider={showAssetForm}
          isValidAddress={isValidAddress}
          nickname={nickname}
          onChangeAddressInput={onChangeInput}
          onPressPaste={(recipient: string) => {
            checkAddress(recipient);
            setRecipient(recipient);
          }}
          recipient={recipient}
          recipientFieldRef={recipientFieldRef}
          removeContact={onRemoveContact}
          showAssetList={showAssetList}
          userAccounts={filteredUserAccountsFromContacts}
          watchedAccounts={watchedAccounts}
        />
        {showEmptyState && (
          <SendContactList
            contacts={filteredContacts}
            currentInput={currentInput}
            ensSuggestions={ensSuggestions}
            key={sendContactListDataKey}
            loadingEnsSuggestions={loadingEnsSuggestions}
            onPressContact={(recipient: string, nickname: string) => {
              setIsValidAddress(true);
              setRecipient(recipient);
              setNickname(nickname);
            }}
            removeContact={onRemoveContact}
            userAccounts={filteredUserAccountsFromContacts}
            watchedAccounts={watchedAccounts}
          />
        )}
        {showAssetList &&
          (!isEmptyWallet ? (
            <SendAssetList
              hiddenCoins={hiddenAssets}
              nativeCurrency={nativeCurrency}
              onSelectAsset={sendUpdateSelected}
              pinnedCoins={pinnedCoinsObj}
              sortedAssets={sortedAssets}
              theme={theme}
              uniqueTokens={sendableUniqueTokens}
            />
          ) : (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: '100%',
                height: sheetHeight,
                alignItems: 'center',
                justifyContent: 'center',
                bottom: 0,
              }}
            >
              <NoResults type={NoResultsType.Send} />
            </View>
          ))}
        {showAssetForm && (
          <SendAssetForm
            assetAmount={amountDetails.assetAmount}
            assetInputRef={assetInputRef}
            buttonRenderer={
              <SheetActionButton
                color={colorForAsset}
                disabled={buttonDisabled}
                forceShadows
                label={buttonLabel}
                onPress={showConfirmationSheet}
                scaleTo={buttonDisabled ? 1.025 : 0.9}
                size="big"
                style={{ width: '100%' }}
                testID="send-sheet-confirm"
                weight="heavy"
              />
            }
            colorForAsset={colorForAsset}
            nativeAmount={amountDetails.nativeAmount}
            nativeCurrency={nativeCurrency}
            nativeCurrencyInputRef={nativeCurrencyInputRef}
            onChangeAssetAmount={onChangeAssetAmount}
            onChangeNativeAmount={onChangeNativeAmount}
            onResetAssetSelection={onResetAssetSelection}
            selected={selected}
            sendMaxBalance={() => setMaxEnabled(true)}
            setLastFocusedInputHandle={setLastFocusedInputHandle}
            txSpeedRenderer={
              shouldShowSponsoredSendGas ? (
                <View style={{ height: 18 }} />
              ) : (
                <GasSpeedButton
                  asset={selected}
                  fallbackColor={colorForAsset}
                  chainId={currentChainId}
                  horizontalPadding={0}
                  marginBottom={17}
                  theme={isDarkMode ? 'dark' : 'light'}
                />
              )
            }
          />
        )}
      </SheetContainer>
    </Container>
  );
}
