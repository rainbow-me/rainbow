import { RouteProp, useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import { isEmpty, isEqual, isString } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Keyboard, StatusBar, TextInput, View } from 'react-native';
import { useDebounce } from 'use-debounce';
import { GasSpeedButton } from '../components/gas';
import { Column } from '../components/layout';
import { SendAssetForm, SendAssetList, SendContactList, SendHeader } from '../components/send';
import { SheetActionButton } from '../components/sheet';
import { getDefaultCheckboxes } from './SendConfirmationSheet';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics, analyticsV2 } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { AssetTypes, NewTransaction, ParsedAddressAsset, TransactionStatus, UniqueAsset } from '@/entities';
import { isNativeAsset } from '@/handlers/assets';
import { debouncedFetchSuggestions } from '@/handlers/ens';
import {
  buildTransaction,
  createSignableTransaction,
  estimateGasLimit,
  getProvider,
  isL2Chain,
  NewTransactionNonNullable,
  resolveNameOrAddress,
} from '@/handlers/web3';
import { checkIsValidAddressOrDomain, checkIsValidAddressOrDomainFormat, isENSAddressFormat } from '@/helpers/validators';
import {
  prefetchENSAvatar,
  prefetchENSCover,
  useAccountSettings,
  useCoinListEditOptions,
  useColorForAsset,
  useContacts,
  useENSProfile,
  useENSRegistrationActionHandler,
  useGas,
  useMaxInputBalance,
  usePrevious,
  useSendableUniqueTokens,
  useSendSheetInputRefs,
  useUserAccounts,
  useWallets,
} from '@/hooks';
import { loadWallet, sendTransaction } from '@/model/wallet';
import { useNavigation } from '@/navigation/Navigation';
import { parseGasParamsForTransaction } from '@/parsers';
import { rainbowTokenList } from '@/references';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { borders } from '@/styles';
import { convertAmountAndPriceToNativeDisplay, convertAmountFromNativeValue, formatInputDecimals, lessThan } from '@/helpers/utilities';
import { deviceUtils, ethereumUtils, getUniqueTokenType, isLowerCaseMatch, safeAreaInsetValues } from '@/utils';
import { logger, RainbowError } from '@/logger';
import { IS_ANDROID, IS_IOS } from '@/env';
import { NoResults } from '@/components/list';
import { NoResultsType } from '@/components/list/NoResults';
import { setHardwareTXError } from '@/navigation/HardwareWalletTxNavigator';
import { Wallet } from '@ethersproject/wallet';
import { addNewTransaction } from '@/state/pendingTransactions';
import { getNextNonce } from '@/state/nonces';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { performanceTracking, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { REGISTRATION_STEPS } from '@/helpers/ens';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { RootStackParamList } from '@/navigation/types';
import { ThemeContextProps, useTheme } from '@/theme';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Contact } from '@/redux/contacts';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import store from '@/redux/store';

const sheetHeight = deviceUtils.dimensions.height - (IS_ANDROID ? 30 : 10);
const statusBarHeight = IS_IOS ? safeAreaInsetValues.top : StatusBar.currentHeight;

type ComponentPropsWithTheme = {
  theme: ThemeContextProps;
};

const Container = styled(View)({
  backgroundColor: ({ theme: { colors } }: ComponentPropsWithTheme) => colors.transparent,
  flex: 1,
  paddingTop: IS_IOS ? 0 : statusBarHeight,
  width: '100%',
});

const SheetContainer = styled(Column).attrs({
  align: 'center',
  flex: 1,
})({
  ...borders.buildRadiusAsObject('top', IS_IOS ? 0 : 16),
  backgroundColor: ({ theme: { colors } }: ComponentPropsWithTheme) => colors.white,
  height: sheetHeight,
  width: '100%',
});

const validateRecipient = (toAddress?: string, tokenAddress?: string) => {
  const { wallets } = store.getState().wallets;
  // check for if the recipient is in a damaged wallet state and prevent
  if (wallets) {
    const internalWallet = Object.values(wallets).find(wallet =>
      wallet.addresses.some(address => isLowerCaseMatch(address.address, toAddress))
    );
    if (internalWallet?.damaged) {
      return false;
    }
  }

  if (!toAddress || toAddress?.toLowerCase() === tokenAddress?.toLowerCase()) {
    return false;
  }

  // Don't allow send to known ERC20 contracts on mainnet
  if (rainbowTokenList.RAINBOW_TOKEN_LIST[toAddress.toLowerCase()]) {
    return false;
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
  const isLoadingUserAssets = useUserAssetsStore(state => state.isLoadingUserAssets);
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
  } = useGas();
  const recipientFieldRef = useRef<TextInput | null>(null);
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const { contacts, onRemoveContact, filteredContacts } = useContacts();
  const { userAccounts, watchedAccounts } = useUserAccounts();
  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const { accountAddress, nativeCurrency, chainId } = useAccountSettings();
  const { isHardwareWallet } = useWallets();

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

  const { params } = useRoute<RouteProp<RootStackParamList, 'SendSheet'>>();
  const assetOverride = params?.asset;
  const prevAssetOverride = usePrevious(assetOverride);

  const recipientOverride = params?.address;
  const nativeAmountOverride = params?.nativeAmount;
  const [recipient, setRecipient] = useState('');
  const [nickname, setNickname] = useState('');
  const [selected, setSelected] = useState<ParsedAddressAsset | UniqueAsset | undefined>();
  const [maxEnabled, setMaxEnabled] = useState(false);
  const { maxInputBalance, updateMaxInputBalance } = useMaxInputBalance();

  const [debouncedInput] = useDebounce(currentInput, 500);
  const [debouncedRecipient] = useDebounce(recipient, 500);

  const [isValidAddress, setIsValidAddress] = useState(!!recipientOverride);
  const [currentProvider, setCurrentProvider] = useState<StaticJsonRpcProvider | undefined>(getProvider({ chainId: ChainId.mainnet }));
  const theme = useTheme();
  const { colors, isDarkMode } = theme;

  const { nativeCurrencyInputRef, setLastFocusedInputHandle, assetInputRef } = useSendSheetInputRefs();

  const showEmptyState = !isValidAddress;
  const showAssetList = isValidAddress && isEmpty(selected);
  const showAssetForm = isValidAddress && !isEmpty(selected);

  const isNft = selected?.type === AssetTypes.nft;
  const isUniqueAsset = selected && 'collection' in selected;

  let colorForAsset = useColorForAsset(selected, undefined, false, true);
  const nftColor = usePersistentDominantColorFromImage(isUniqueAsset && isNft ? selected?.lowResUrl : null) ?? colors.appleBlue;
  if (isNft) {
    colorForAsset = nftColor;
  }

  const uniqueTokenType = isUniqueAsset && isNft ? getUniqueTokenType(selected) : undefined;
  const isENS = uniqueTokenType === 'ENS';

  const ensName = selected?.uniqueId ? selected.uniqueId?.split(' ')?.[0] : selected?.uniqueId ?? '';
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
        const priceUnit = !isUniqueAsset ? selected?.price?.value ?? 0 : selected?.currentPrice ?? 0;
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
      if (newSelected?.type === AssetTypes.nft) {
        setAmountDetails({
          assetAmount: '1',
          isSufficientBalance: true,
          nativeAmount: '0',
        });

        const isUniqueAsset = 'collection' in newSelected;

        // Prevent a state update loop
        if (selected?.uniqueId !== newSelected?.uniqueId && isUniqueAsset) {
          setSelected({
            ...newSelected,
            symbol: newSelected?.collection?.name,
          });
        }
      } else {
        setSelected(newSelected);
        sendUpdateAssetAmount('');
      }
    },
    [selected, sendUpdateAssetAmount, updateMaxInputBalance]
  );

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
  }, [currentChainId, isNft, chainId, prevChainId, selected?.chainId]);

  const onChangeNativeAmount = useCallback(
    (newNativeAmount: string) => {
      if (!isString(newNativeAmount)) return;
      if (maxEnabled) {
        setMaxEnabled(false);
      }
      const _nativeAmount = newNativeAmount.replace(/[^0-9.]/g, '');
      let _assetAmount = '';
      if (_nativeAmount.length) {
        const priceUnit = !isUniqueAsset ? selected?.price?.value ?? 0 : 0;
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
      analytics.track('Changed native currency input in Send flow');
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
        analytics.track('Changed token input in Send flow');
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

      const wallet = await performanceTracking.getState().executeFn({
        fn: loadWallet,
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

      const validTransaction = isValidAddress && amountDetails.isSufficientBalance && isSufficientGas && isValidGas;
      if (!selectedGasFee?.gasFee?.estimatedFee || !validTransaction) {
        logger.error(new RainbowError(`[SendSheet]: preventing tx submit because selectedGasFee is missing or validTransaction is false`), {
          selectedGasFee,
          validTransaction,
          isValidGas,
        });
        return false;
      }

      let submitSuccess = false;
      let updatedGasLimit = null;

      // Attempt to update gas limit before sending ERC20 / ERC721
      if (!isUniqueAsset && selected && !isNativeAsset(selected.address, currentChainId)) {
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

      try {
        const signableTransaction = await performanceTracking.getState().executeFn({
          fn: createSignableTransaction,
          operation: TimeToSignOperation.CreateSignableTransaction,
          screen: isENS ? Screens.SEND_ENS : Screens.SEND,
        })(txDetails as NewTransactionNonNullable);
        if (!signableTransaction.to) {
          logger.error(new RainbowError(`[SendSheet]: txDetails is missing the "to" field`), {
            txDetails,
            signableTransaction,
          });
          Alert.alert(lang.t('wallet.transaction.alert.invalid_transaction'));
          submitSuccess = false;
        } else {
          const sendTransactionResult = await performanceTracking.getState().executeFn({
            fn: sendTransaction,
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
          }
        }
      } catch (error) {
        submitSuccess = false;
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
      selected,
      selectedGasFee,
      toAddress,
      transferENS,
      updateTxFee,
      updateTxFeeForOptimism,
    ]
  );

  const submitTransaction = useCallback(
    async (args: OnSubmitProps) => {
      if (Number(amountDetails.assetAmount) <= 0) {
        logger.error(new RainbowError(`[SendSheet]: preventing tx submit because amountDetails.assetAmount is <= 0`), {
          amountDetails,
        });
        return false;
      }
      const submitSuccessful = await onSubmit(args);
      analytics.track('Sent transaction', {
        assetName: selected?.name || '',
        network: selected?.network || '',
        isRecepientENS: recipient.slice(-4).toLowerCase() === '.eth',
        isHardwareWallet,
      });

      const goBackAndNavigate = () => {
        goBack();
        navigate(Routes.WALLET_SCREEN);
        InteractionManager.runAfterInteractions(() => {
          navigate(Routes.PROFILE_SCREEN);
        });
      };

      if (submitSuccessful) {
        performanceTracking.getState().executeFn({
          fn: goBackAndNavigate,
          screen: isENS ? Screens.SEND_ENS : Screens.SEND,
          operation: TimeToSignOperation.SheetDismissal,
          endOfOperation: true,
        })();
      }
    },
    [amountDetails, goBack, isENS, isHardwareWallet, navigate, onSubmit, recipient, selected?.name, selected?.network]
  );

  const { buttonDisabled, buttonLabel } = useMemo(() => {
    const isZeroAssetAmount = Number(amountDetails.assetAmount) <= 0;
    let disabled = true;
    let label = lang.t('button.confirm_exchange.enter_amount');

    if (isENS && !ensProfile.isSuccess) {
      label = lang.t('button.confirm_exchange.loading');
      disabled = true;
    } else if (
      isEmpty(gasFeeParamsBySpeed) ||
      !selectedGasFee ||
      isEmpty(selectedGasFee?.gasFee) ||
      !toAddress ||
      (useBackendNetworksStore.getState().getNeedsL1SecurityFeeChains().includes(currentChainId) && l1GasFeeOptimism === null)
    ) {
      label = lang.t('button.confirm_exchange.loading');
      disabled = true;
    } else if (!isZeroAssetAmount && !isSufficientGas) {
      disabled = true;
      label = lang.t('button.confirm_exchange.insufficient_token', {
        tokenName: useBackendNetworksStore.getState().getChainsNativeAsset()[currentChainId || ChainId.mainnet].symbol,
      });
    } else if (!isValidGas) {
      disabled = true;
      label = lang.t('button.confirm_exchange.invalid_fee');
    } else if (!isZeroAssetAmount && !amountDetails.isSufficientBalance) {
      disabled = true;
      label = lang.t('button.confirm_exchange.insufficient_funds');
    } else if (!isZeroAssetAmount) {
      disabled = false;
      label = `􀕹 ${lang.t('button.confirm_exchange.review')}`;
    }

    return { buttonDisabled: disabled, buttonLabel: label };
  }, [
    amountDetails.assetAmount,
    amountDetails.isSufficientBalance,
    isENS,
    ensProfile.isSuccess,
    gasFeeParamsBySpeed,
    selectedGasFee,
    toAddress,
    currentChainId,
    l1GasFeeOptimism,
    isSufficientGas,
    isValidGas,
  ]);

  const showConfirmationSheet = useCallback(async () => {
    if (buttonDisabled) return;
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
    const uniqueTokenType = isUniqueAsset ? getUniqueTokenType(selected) : undefined;
    const isENS = uniqueTokenType === 'ENS';
    const checkboxes = getDefaultCheckboxes({
      ensProfile,
      isENS: true,
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
      isNft,
      chainId: currentChainId,
      profilesEnabled,
      to: recipient,
      toAddress,
    });
  }, [
    buttonDisabled,
    recipient,
    isUniqueAsset,
    selected,
    assetInputRef,
    nativeCurrencyInputRef,
    ensProfile,
    chainId,
    navigate,
    amountDetails,
    submitTransaction,
    isL2,
    isNft,
    currentChainId,
    profilesEnabled,
  ]);

  const onResetAssetSelection = useCallback(() => {
    analytics.track('Reset asset selection in Send flow');
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
    if ((isValidAddress && showAssetList) || (isValidAddress && showAssetForm && selected?.type === AssetTypes.nft)) {
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
    toAddress,
    updateTxFee,
    updateTxFeeForOptimism,
    chainId,
    isNft,
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
    analyticsV2.track(analyticsV2.event.tokenList, params);
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
              <GasSpeedButton
                asset={selected}
                fallbackColor={colorForAsset}
                chainId={currentChainId}
                horizontalPadding={0}
                marginBottom={17}
                theme={isDarkMode ? 'dark' : 'light'}
              />
            }
          />
        )}
      </SheetContainer>
    </Container>
  );
}
