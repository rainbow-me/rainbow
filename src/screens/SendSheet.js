import { useRoute } from '@react-navigation/native';
import { captureEvent, captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import { isEmpty, isEqual, isString } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Keyboard, StatusBar, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';
import { GasSpeedButton } from '../components/gas';
import { Column } from '../components/layout';
import { SendAssetForm, SendAssetList, SendContactList, SendHeader } from '../components/send';
import { SheetActionButton } from '../components/sheet';
import { getDefaultCheckboxes } from './SendConfirmationSheet';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { AssetTypes } from '@/entities';
import { isNativeAsset } from '@/handlers/assets';
import { debouncedFetchSuggestions } from '@/handlers/ens';
import {
  buildTransaction,
  createSignableTransaction,
  estimateGasLimit,
  getProviderForNetwork,
  isL2Network,
  resolveNameOrAddress,
  web3Provider,
} from '@/handlers/web3';
import Network from '@/helpers/networkTypes';
import { checkIsValidAddressOrDomain, checkIsValidAddressOrDomainFormat, isENSAddressFormat } from '@/helpers/validators';
import {
  prefetchENSAvatar,
  prefetchENSCover,
  useAccountSettings,
  useCoinListEditOptions,
  useColorForAsset,
  useContacts,
  useCurrentNonce,
  useENSProfile,
  useENSRegistrationActionHandler,
  useGas,
  useMaxInputBalance,
  usePrevious,
  useSendableUniqueTokens,
  useSendSheetInputRefs,
  useTransactionConfirmation,
  useUserAccounts,
  useWallets,
} from '@/hooks';
import { loadWallet, sendTransaction } from '@/model/wallet';
import { useNavigation } from '@/navigation/Navigation';
import { parseGasParamsForTransaction } from '@/parsers';
import { rainbowTokenList } from '@/references';
import { useSortedUserAssets } from '@/resources/assets/useSortedUserAssets';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { borders } from '@/styles';
import { convertAmountAndPriceToNativeDisplay, convertAmountFromNativeValue, formatInputDecimals, lessThan } from '@/helpers/utilities';
import { deviceUtils, ethereumUtils, getUniqueTokenType, safeAreaInsetValues } from '@/utils';
import logger from '@/utils/logger';
import { IS_ANDROID, IS_IOS } from '@/env';
import { NoResults } from '@/components/list';
import { NoResultsType } from '@/components/list/NoResults';
import { setHardwareTXError } from '@/navigation/HardwareWalletTxNavigator';
import { Wallet } from '@ethersproject/wallet';
import { getNetworkObj } from '@/networks';
import { addNewTransaction } from '@/state/pendingTransactions';
import { getNextNonce } from '@/state/nonces';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';

const sheetHeight = deviceUtils.dimensions.height - (IS_ANDROID ? 30 : 10);
const statusBarHeight = IS_IOS ? safeAreaInsetValues.top : StatusBar.currentHeight;

const Container = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
  flex: 1,
  paddingTop: IS_IOS ? 0 : statusBarHeight,
  width: '100%',
});

const SheetContainer = styled(Column).attrs({
  align: 'center',
  flex: 1,
})({
  ...borders.buildRadiusAsObject('top', IS_IOS ? 0 : 16),
  backgroundColor: ({ theme: { colors } }) => colors.white,
  height: sheetHeight,
  width: '100%',
});

const validateRecipient = (toAddress, tokenAddress) => {
  if (toAddress?.toLowerCase() === tokenAddress?.toLowerCase()) {
    return false;
  }
  // Don't allow send to known ERC20 contracts on mainnet
  if (rainbowTokenList.RAINBOW_TOKEN_LIST[toAddress.toLowerCase()]) {
    return false;
  }
  return true;
};

export default function SendSheet(props) {
  const { goBack, navigate } = useNavigation();
  const { data: sortedAssets } = useSortedUserAssets();
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
  const recipientFieldRef = useRef();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const { contacts, onRemoveContact, filteredContacts } = useContacts();
  const { userAccounts, watchedAccounts } = useUserAccounts();
  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const { accountAddress, nativeCurrency, network } = useAccountSettings();
  const { isHardwareWallet } = useWallets();

  const { action: transferENS } = useENSRegistrationActionHandler({
    step: 'TRANSFER',
  });

  const { hiddenCoinsObj, pinnedCoinsObj } = useCoinListEditOptions();
  const [toAddress, setToAddress] = useState();
  const [amountDetails, setAmountDetails] = useState({
    assetAmount: '',
    isSufficientBalance: false,
    nativeAmount: '',
  });
  const [currentNetwork, setCurrentNetwork] = useState();
  const prevNetwork = usePrevious(currentNetwork);
  const [currentInput, setCurrentInput] = useState('');

  const { params } = useRoute();
  const assetOverride = params?.asset;
  const prevAssetOverride = usePrevious(assetOverride);

  const recipientOverride = params?.address;
  const nativeAmountOverride = params?.nativeAmount;
  const [recipient, setRecipient] = useState('');
  const [nickname, setNickname] = useState('');
  const [selected, setSelected] = useState({});
  const [maxEnabled, setMaxEnabled] = useState(false);
  const { maxInputBalance, updateMaxInputBalance } = useMaxInputBalance();

  const [debouncedInput] = useDebounce(currentInput, 500);
  const [debouncedRecipient] = useDebounce(recipient, 500);

  const [isValidAddress, setIsValidAddress] = useState(!!recipientOverride);
  const [currentProvider, setCurrentProvider] = useState();
  const theme = useTheme();
  const { colors, isDarkMode } = theme;

  const { nativeCurrencyInputRef, setLastFocusedInputHandle, assetInputRef } = useSendSheetInputRefs();

  const showEmptyState = !isValidAddress;
  const showAssetList = isValidAddress && isEmpty(selected);
  const showAssetForm = isValidAddress && !isEmpty(selected);

  const isNft = selected?.type === AssetTypes.nft;

  let colorForAsset = useColorForAsset(selected, null, false, true);
  const nftColor = usePersistentDominantColorFromImage(selected?.lowResUrl) ?? colors.appleBlue;

  if (isNft) {
    colorForAsset = nftColor;
  }

  const uniqueTokenType = isNft ? getUniqueTokenType(selected) : undefined;
  const isENS = uniqueTokenType === 'ENS';

  const ensName = selected.uniqueId ? selected.uniqueId?.split(' ')?.[0] : selected.uniqueId;
  const ensProfile = useENSProfile(ensName, {
    enabled: isENS,
    supportedRecordsOnly: false,
  });

  const isL2 = useMemo(() => {
    return isL2Network(currentNetwork);
  }, [currentNetwork]);

  const sendUpdateAssetAmount = useCallback(
    newAssetAmount => {
      const _assetAmount = newAssetAmount.replace(/[^0-9.]/g, '');
      let _nativeAmount = '';
      if (_assetAmount.length) {
        const priceUnit = selected?.price?.value ?? 0;
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
    [maxInputBalance, nativeCurrency, selected]
  );

  const sendUpdateSelected = useCallback(
    newSelected => {
      if (isEqual(newSelected, selected)) return;
      updateMaxInputBalance(newSelected);
      if (newSelected?.type === AssetTypes.nft) {
        setAmountDetails({
          assetAmount: '1',
          isSufficientBalance: true,
          nativeAmount: '0',
        });

        // Prevent a state update loop
        if (selected?.uniqueId !== newSelected?.uniqueId) {
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

    if (nativeAmountOverride && !amountDetails.assetAmount && maxInputBalance) {
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
    if (prevNetwork !== currentNetwork) {
      InteractionManager.runAfterInteractions(() => {
        startPollingGasFees(currentNetwork);
      });
    }
  }, [prevNetwork, startPollingGasFees, selected?.network, currentNetwork]);

  // Stop polling when the sheet is unmounted
  useEffect(() => {
    return () => {
      InteractionManager.runAfterInteractions(() => {
        stopPollingGasFees();
      });
    };
  }, [stopPollingGasFees]);

  useEffect(() => {
    const assetNetwork = selected?.network;
    if (assetNetwork && (assetNetwork !== currentNetwork || !currentNetwork || prevNetwork !== currentNetwork)) {
      let provider = web3Provider;
      const selectedNetwork = selected?.network;
      if (network === Network.goerli) {
        setCurrentNetwork(Network.goerli);
        provider = getProviderForNetwork(Network.goerli);
        setCurrentProvider(provider);
      } else {
        setCurrentNetwork(selectedNetwork);
        provider = getProviderForNetwork(selectedNetwork);
        setCurrentProvider(provider);
      }
    }
  }, [currentNetwork, isNft, network, prevNetwork, selected?.network, sendUpdateSelected]);

  const onChangeNativeAmount = useCallback(
    newNativeAmount => {
      if (!isString(newNativeAmount)) return;
      if (maxEnabled) {
        setMaxEnabled(false);
      }
      const _nativeAmount = newNativeAmount.replace(/[^0-9.]/g, '');
      let _assetAmount = '';
      if (_nativeAmount.length) {
        const priceUnit = selected?.price?.value ?? 0;
        const convertedAssetAmount = convertAmountFromNativeValue(_nativeAmount, priceUnit, selected.decimals);
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
    [maxEnabled, maxInputBalance, selected.decimals, selected?.price?.value]
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
    newAssetAmount => {
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
      let realAddress = debouncedRecipient;
      const isValid = await checkIsValidAddressOrDomainFormat(debouncedRecipient);
      if (isValid) {
        realAddress = await resolveNameOrAddress(debouncedRecipient);
        setToAddress(realAddress);
      } else {
        setIsValidAddress(false);
      }
    };
    debouncedRecipient && resolveAddressIfNeeded();
  }, [debouncedRecipient]);

  const updateTxFeeForOptimism = useCallback(
    async updatedGasLimit => {
      const txData = await buildTransaction(
        {
          address: accountAddress,
          amount: amountDetails.assetAmount,
          asset: selected,
          gasLimit: updatedGasLimit,
          recipient: toAddress,
        },
        currentProvider,
        currentNetwork
      );
      const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(txData, currentProvider);
      updateTxFee(updatedGasLimit, null, l1GasFeeOptimism);
    },
    [accountAddress, amountDetails.assetAmount, currentNetwork, currentProvider, selected, toAddress, updateTxFee]
  );

  const onSubmit = useCallback(
    async ({ ens: { setAddress, transferControl, clearRecords } = {} } = {}) => {
      const wallet = await loadWallet(undefined, true, currentProvider);
      if (!wallet) return;

      const validTransaction = isValidAddress && amountDetails.isSufficientBalance && isSufficientGas && isValidGas;
      if (!selectedGasFee?.gasFee?.estimatedFee || !validTransaction) {
        logger.sentry('preventing tx submit for one of the following reasons:');
        logger.sentry('selectedGasFee ? ', selectedGasFee);
        logger.sentry('selectedGasFee.maxFee ? ', selectedGasFee?.maxFee);
        logger.sentry('validTransaction ? ', validTransaction);
        logger.sentry('isValidGas ? ', isValidGas);
        captureEvent('Preventing tx submit');
        return false;
      }

      let submitSuccess = false;
      let updatedGasLimit = null;

      // Attempt to update gas limit before sending ERC20 / ERC721
      if (!isNativeAsset(selected.address, currentNetwork)) {
        try {
          // Estimate the tx with gas limit padding before sending
          updatedGasLimit = await estimateGasLimit(
            {
              address: accountAddress,
              amount: amountDetails.assetAmount,
              asset: selected,
              recipient: toAddress,
            },
            true,
            currentProvider,
            currentNetwork
          );

          if (!lessThan(updatedGasLimit, gasLimit)) {
            if (getNetworkObj(currentNetwork).gas?.OptimismTxFee) {
              updateTxFeeForOptimism(updatedGasLimit);
            } else {
              updateTxFee(updatedGasLimit, null);
            }
          }
          // eslint-disable-next-line no-empty
        } catch (e) {}
      }

      let nextNonce;

      if (isENS && toAddress && (clearRecords || setAddress || transferControl)) {
        const { nonce } = await transferENS(() => null, {
          clearRecords,
          name: ensName,
          records: {
            ...(ensProfile?.data?.contenthash ? { contenthash: ensProfile?.data?.contenthash } : {}),
            ...(ensProfile?.data?.records || {}),
            ...(ensProfile?.data?.coinAddresses || {}),
          },
          setAddress,
          toAddress,
          transferControl,
          wallet,
        });
        nextNonce = nonce + 1;
      }

      const gasLimitToUse = updatedGasLimit && !lessThan(updatedGasLimit, gasLimit) ? updatedGasLimit : gasLimit;

      const gasParams = parseGasParamsForTransaction(selectedGasFee);
      const txDetails = {
        amount: amountDetails.assetAmount,
        asset: selected,
        from: accountAddress,
        gasLimit: gasLimitToUse,
        network: currentNetwork,
        nonce: nextNonce ?? (await getNextNonce({ address: accountAddress, network: currentNetwork })),
        to: toAddress,
        ...gasParams,
      };

      try {
        const signableTransaction = await createSignableTransaction(txDetails);
        if (!signableTransaction.to) {
          logger.sentry('txDetails', txDetails);
          logger.sentry('signableTransaction', signableTransaction);
          logger.sentry('"to" field is missing!');
          const e = new Error('Transaction missing TO field');
          captureException(e);
          Alert.alert(lang.t('wallet.transaction.alert.invalid_transaction'));
          submitSuccess = false;
        } else {
          const { result: txResult, error } = await sendTransaction({
            existingWallet: wallet,
            provider: currentProvider,
            transaction: signableTransaction,
          });

          if (error) {
            throw new Error(`SendSheet sendTransaction failed`);
          }

          const { hash, nonce } = txResult;
          const { data, value } = signableTransaction;
          if (!isEmpty(hash)) {
            submitSuccess = true;
            txDetails.hash = hash;
            txDetails.nonce = nonce;
            txDetails.network = currentNetwork;
            txDetails.data = data;
            txDetails.value = value;
            txDetails.txTo = signableTransaction.to;
            txDetails.pending = true;
            txDetails.type = 'send';
            txDetails.status = 'pending';
            addNewTransaction({
              address: accountAddress,
              network: currentNetwork,
              transaction: txDetails,
            });
          }
        }
      } catch (error) {
        submitSuccess = false;
        logger.sentry('TX Details', txDetails);
        logger.sentry('SendSheet onSubmit error');
        logger.sentry(error);
        captureException(error);

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
      currentNetwork,
      currentProvider,
      ensName,
      ensProfile?.data?.coinAddresses,
      ensProfile?.data?.contenthash,
      ensProfile?.data?.records,
      gasLimit,
      isENS,
      isSufficientGas,
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
    async (...args) => {
      if (Number(amountDetails.assetAmount) <= 0) {
        logger.sentry('amountDetails.assetAmount ? ', amountDetails?.assetAmount);
        captureEvent('Preventing tx submit due to amount <= 0');
        return false;
      }
      const submitSuccessful = await onSubmit(...args);
      analytics.track('Sent transaction', {
        assetName: selected?.name || '',
        network: selected?.network || '',
        isRecepientENS: recipient.slice(-4).toLowerCase() === '.eth',
        isHardwareWallet,
      });

      if (submitSuccessful) {
        goBack();
        navigate(Routes.WALLET_SCREEN);
        InteractionManager.runAfterInteractions(() => {
          navigate(Routes.PROFILE_SCREEN);
        });
      }
    },
    [amountDetails.assetAmount, goBack, isHardwareWallet, navigate, onSubmit, recipient, selected?.name, selected?.network]
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
      (getNetworkObj(currentNetwork).gas?.OptimismTxFee && l1GasFeeOptimism === null)
    ) {
      label = lang.t('button.confirm_exchange.loading');
      disabled = true;
    } else if (!isZeroAssetAmount && !isSufficientGas) {
      disabled = true;
      label = lang.t('button.confirm_exchange.insufficient_token', {
        tokenName: getNetworkObj(currentNetwork).nativeCurrency.symbol,
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
    currentNetwork,
    l1GasFeeOptimism,
    isSufficientGas,
    isValidGas,
  ]);

  const showConfirmationSheet = useCallback(async () => {
    if (buttonDisabled) return;
    let toAddress = recipient;
    const isValid = await checkIsValidAddressOrDomain(recipient);
    if (isValid) {
      toAddress = await resolveNameOrAddress(recipient);
    }
    const tokenAddress = selected?.address;
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
    const uniqueTokenType = getUniqueTokenType(selected);
    const isENS = uniqueTokenType === 'ENS';
    const checkboxes = getDefaultCheckboxes({
      ensProfile,
      isENS: true,
      network,
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
      network: currentNetwork,
      profilesEnabled,
      to: recipient,
      toAddress,
    });
  }, [
    amountDetails,
    assetInputRef,
    buttonDisabled,
    currentNetwork,
    ensProfile,
    isL2,
    isNft,
    nativeCurrencyInputRef,
    navigate,
    network,
    profilesEnabled,
    recipient,
    selected,
    submitTransaction,
  ]);

  const onResetAssetSelection = useCallback(() => {
    analytics.track('Reset asset selection in Send flow');
    sendUpdateSelected({});
  }, [sendUpdateSelected]);

  const onChangeInput = useCallback(
    text => {
      const isValid = checkIsValidAddressOrDomainFormat(text);
      if (!isValid) {
        setIsValidAddress();
      }
      setToAddress();
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

  const checkAddress = useCallback(recipient => {
    if (recipient) {
      const isValidFormat = checkIsValidAddressOrDomainFormat(recipient);
      setIsValidAddress(isValidFormat);
    }
  }, []);

  const [ensSuggestions, setEnsSuggestions] = useState([]);
  const [loadingEnsSuggestions, setLoadingEnsSuggestions] = useState(false);
  useEffect(() => {
    if (network === Network.mainnet && !recipientOverride && recipient?.length) {
      setLoadingEnsSuggestions(true);
      debouncedFetchSuggestions(recipient, setEnsSuggestions, setLoadingEnsSuggestions, profilesEnabled);
    }
  }, [network, recipient, recipientOverride, setEnsSuggestions, watchedAccounts, profilesEnabled]);

  useEffect(() => {
    checkAddress(debouncedInput);
  }, [checkAddress, debouncedInput]);

  useEffect(() => {
    if (!currentProvider?._network?.chainId) return;
    const currentProviderNetwork = ethereumUtils.getNetworkFromChainId(Number(currentProvider._network.chainId));
    const assetNetwork = selected?.network;

    if (assetNetwork === currentNetwork && currentProviderNetwork === currentNetwork && isValidAddress && !isEmpty(selected)) {
      estimateGasLimit(
        {
          address: accountAddress,
          amount: amountDetails.assetAmount,
          asset: selected,
          recipient: toAddress,
        },
        false,
        currentProvider,
        currentNetwork
      )
        .then(async gasLimit => {
          if (getNetworkObj(currentNetwork).gas?.OptimismTxFee) {
            updateTxFeeForOptimism(gasLimit);
          } else {
            updateTxFee(gasLimit, null);
          }
        })
        .catch(e => {
          logger.sentry('Error calculating gas limit', e);
          updateTxFee(null, null);
        });
    }
  }, [
    accountAddress,
    amountDetails.assetAmount,
    currentNetwork,
    currentProvider,
    isValidAddress,
    recipient,
    selected,
    toAddress,
    updateTxFee,
    updateTxFeeForOptimism,
    network,
    isNft,
  ]);

  const sendContactListDataKey = useMemo(() => `${ensSuggestions?.[0]?.address || '_'}`, [ensSuggestions]);

  const isEmptyWallet = !sortedAssets?.length && !sendableUniqueTokens?.length;

  return (
    <Container testID="send-sheet">
      <SheetContainer>
        <SendHeader
          colorForAsset={colorForAsset}
          contacts={contacts}
          fromProfile={params?.fromProfile}
          hideDivider={showAssetForm}
          isValidAddress={isValidAddress}
          nickname={nickname}
          onChangeAddressInput={onChangeInput}
          onPressPaste={recipient => {
            checkAddress(recipient);
            setRecipient(recipient);
          }}
          recipient={recipient}
          recipientFieldRef={recipientFieldRef}
          removeContact={onRemoveContact}
          showAssetList={showAssetList}
          userAccounts={userAccounts}
          watchedAccounts={watchedAccounts}
        />
        {showEmptyState && (
          <SendContactList
            contacts={filteredContacts}
            currentInput={currentInput}
            ensSuggestions={ensSuggestions}
            key={sendContactListDataKey}
            loadingEnsSuggestions={loadingEnsSuggestions}
            onPressContact={(recipient, nickname) => {
              setIsValidAddress(true);
              setRecipient(recipient);
              setNickname(nickname);
            }}
            removeContact={onRemoveContact}
            userAccounts={userAccounts}
            watchedAccounts={watchedAccounts}
          />
        )}
        {showAssetList &&
          (!isEmptyWallet ? (
            <SendAssetList
              hiddenCoins={hiddenCoinsObj}
              nativeCurrency={nativeCurrency}
              network={network}
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
            {...props}
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
                currentNetwork={currentNetwork}
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
