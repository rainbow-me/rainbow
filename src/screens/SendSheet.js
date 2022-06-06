import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { captureEvent, captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import { isEmpty, isEqual, isString, toLower } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, InteractionManager, Keyboard, StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { KeyboardArea } from 'react-native-keyboard-area';
import { useDispatch } from 'react-redux';
import { GasSpeedButton } from '../components/gas';
import { Column } from '../components/layout';
import {
  SendAssetForm,
  SendAssetList,
  SendContactList,
  SendHeader,
} from '../components/send';
import { SheetActionButton } from '../components/sheet';
import { prefetchENSProfileImages } from '../hooks/useENSProfileImages';
import { PROFILES, useExperimentalFlag } from '@rainbow-me/config';
import { AssetTypes } from '@rainbow-me/entities';
import { isL2Asset, isNativeAsset } from '@rainbow-me/handlers/assets';
import { debouncedFetchSuggestions } from '@rainbow-me/handlers/ens';
import {
  buildTransaction,
  createSignableTransaction,
  estimateGasLimit,
  getProviderForNetwork,
  isL2Network,
  resolveNameOrAddress,
  web3Provider,
} from '@rainbow-me/handlers/web3';
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
import Network from '@rainbow-me/helpers/networkTypes';
import {
  checkIsValidAddressOrDomain,
  isENSAddressFormat,
} from '@rainbow-me/helpers/validators';
import {
  useAccountSettings,
  useCoinListEditOptions,
  useColorForAsset,
  useContacts,
  useCurrentNonce,
  useGas,
  useMaxInputBalance,
  usePrevious,
  useSendableUniqueTokens,
  useSendSavingsAccount,
  useSendSheetInputRefs,
  useSortedAccountAssets,
  useTransactionConfirmation,
  useUpdateAssetOnchainBalance,
  useUserAccounts,
} from '@rainbow-me/hooks';
import { sendTransaction } from '@rainbow-me/model/wallet';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { parseGasParamsForTransaction } from '@rainbow-me/parsers';
import { chainAssets, rainbowTokenList } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { borders } from '@rainbow-me/styles';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountFromNativeValue,
  formatInputDecimals,
  lessThan,
} from '@rainbow-me/utilities';
import { deviceUtils, ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

const sheetHeight = deviceUtils.dimensions.height - (android ? 30 : 10);
const statusBarHeight = getStatusBarHeight(true);

const Container = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
  flex: 1,
  paddingTop: isNativeStackAvailable ? 0 : statusBarHeight,
  width: '100%',
});

const SheetContainer = styled(Column).attrs({
  align: 'center',
  flex: 1,
})({
  ...borders.buildRadiusAsObject('top', isNativeStackAvailable ? 0 : 16),
  backgroundColor: ({ theme: { colors } }) => colors.white,
  height: isNativeStackAvailable || android ? sheetHeight : '100%',
  width: '100%',
});

const KeyboardSizeView = styled(KeyboardArea)({
  backgroundColor: ({ showAssetForm, theme: { colors } }) =>
    showAssetForm ? colors.lighterGrey : colors.white,
  width: '100%',
});

export default function SendSheet(props) {
  const dispatch = useDispatch();
  const { goBack, navigate } = useNavigation();
  const { dataAddNewTransaction } = useTransactionConfirmation();
  const updateAssetOnchainBalanceIfNeeded = useUpdateAssetOnchainBalance();
  const { sortedAssets } = useSortedAccountAssets();
  const {
    gasFeeParamsBySpeed,
    gasLimit,
    isSufficientGas,
    isValidGas,
    prevSelectedGasFee,
    selectedGasFee,
    startPollingGasFees,
    stopPollingGasFees,
    updateDefaultGasLimit,
    updateTxFee,
  } = useGas();
  const recipientFieldRef = useRef();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const { contacts, onRemoveContact, filteredContacts } = useContacts();
  const { userAccounts, watchedAccounts } = useUserAccounts();
  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const { accountAddress, nativeCurrency, network } = useAccountSettings();

  const savings = useSendSavingsAccount();
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

  const getNextNonce = useCurrentNonce(accountAddress, currentNetwork);

  const { params } = useRoute();
  const assetOverride = params?.asset;
  const prevAssetOverride = usePrevious(assetOverride);

  const recipientOverride = params?.address;
  const nativeAmountOverride = params?.nativeAmount;
  const [recipient, setRecipient] = useState('');
  const [nickname, setNickname] = useState('');
  const [selected, setSelected] = useState({});
  const { maxInputBalance, updateMaxInputBalance } = useMaxInputBalance();

  const [isValidAddress, setIsValidAddress] = useState(!!recipientOverride);
  const [currentProvider, setCurrentProvider] = useState();
  const { colors, isDarkMode } = useTheme();

  const {
    nativeCurrencyInputRef,
    setLastFocusedInputHandle,
    assetInputRef,
  } = useSendSheetInputRefs();

  const showEmptyState = !isValidAddress;
  const showAssetList = isValidAddress && isEmpty(selected);
  const showAssetForm = isValidAddress && !isEmpty(selected);

  const isNft = selected?.type === AssetTypes.nft;

  const address = selected?.mainnet_address || selected?.address;
  const type = selected?.mainnet_address ? AssetTypes.token : selected?.type;
  let colorForAsset = useColorForAsset(
    {
      address,
      type,
    },
    null,
    false,
    true
  );
  if (isNft) {
    colorForAsset = colors.appleBlue;
  }

  const isL2 = useMemo(() => {
    return isL2Network(currentNetwork);
  }, [currentNetwork]);

  const sendUpdateAssetAmount = useCallback(
    newAssetAmount => {
      const _assetAmount = newAssetAmount.replace(/[^0-9.]/g, '');
      let _nativeAmount = '';
      if (_assetAmount.length) {
        const priceUnit = selected?.price?.value ?? 0;
        const {
          amount: convertedNativeAmount,
        } = convertAmountAndPriceToNativeDisplay(
          _assetAmount,
          priceUnit,
          nativeCurrency
        );
        _nativeAmount = formatInputDecimals(
          convertedNativeAmount,
          _assetAmount
        );
      }

      const _isSufficientBalance =
        Number(_assetAmount) <= Number(maxInputBalance);

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
  }, [prevNetwork, startPollingGasFees, selected.type, currentNetwork]);

  // Stop polling when the sheet is unmounted
  useEffect(() => {
    return () => {
      InteractionManager.runAfterInteractions(() => {
        stopPollingGasFees();
      });
    };
  }, [stopPollingGasFees]);

  // Recalculate balance when gas price changes
  useEffect(() => {
    if (
      selected?.isNativeAsset &&
      (prevSelectedGasFee?.gasFee?.estimatedFee?.value?.amount ?? 0) !==
        (selectedGasFee?.gasFee?.estimatedFee?.value?.amount ?? 0)
    ) {
      updateMaxInputBalance(selected);
    }
  }, [prevSelectedGasFee, selected, selectedGasFee, updateMaxInputBalance]);

  useEffect(() => {
    const updateNetworkAndProvider = async () => {
      const assetNetwork = isL2Asset(selected?.type) ? selected.type : network;
      if (
        selected?.type &&
        (assetNetwork !== currentNetwork ||
          !currentNetwork ||
          prevNetwork !== currentNetwork)
      ) {
        let provider = web3Provider;
        switch (selected.type) {
          case AssetTypes.polygon:
            setCurrentNetwork(Network.polygon);
            provider = await getProviderForNetwork(Network.polygon);
            break;
          case AssetTypes.arbitrum:
            setCurrentNetwork(Network.arbitrum);
            provider = await getProviderForNetwork(Network.arbitrum);
            break;
          case AssetTypes.optimism:
            setCurrentNetwork(Network.optimism);
            provider = await getProviderForNetwork(Network.optimism);
            break;
          default:
            setCurrentNetwork(network);
        }
        setCurrentProvider(provider);
      }
    };
    updateNetworkAndProvider();
  }, [currentNetwork, network, prevNetwork, selected.type, sendUpdateSelected]);

  useEffect(() => {
    if (isEmpty(selected)) return;
    if (currentProvider?._network?.chainId) {
      const currentProviderNetwork = ethereumUtils.getNetworkFromChainId(
        Number(currentProvider._network.chainId)
      );

      const assetNetwork = isL2Asset(selected?.type) ? selected.type : network;

      if (
        assetNetwork === currentNetwork &&
        currentProviderNetwork === currentNetwork
      ) {
        updateAssetOnchainBalanceIfNeeded(
          selected,
          accountAddress,
          currentNetwork,
          currentProvider,
          updatedAsset => {
            // set selected asset with new balance
            if (!isEqual(selected, updatedAsset)) {
              setSelected(updatedAsset);
              updateMaxInputBalance(updatedAsset);
              sendUpdateAssetAmount('');
            }
          }
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountAddress, currentProvider, currentNetwork, selected]);

  const onChangeNativeAmount = useCallback(
    newNativeAmount => {
      if (!isString(newNativeAmount)) return;
      const _nativeAmount = newNativeAmount.replace(/[^0-9.]/g, '');
      let _assetAmount = '';
      if (_nativeAmount.length) {
        const priceUnit = selected?.price?.value ?? 0;
        const convertedAssetAmount = convertAmountFromNativeValue(
          _nativeAmount,
          priceUnit,
          selected.decimals
        );
        _assetAmount = formatInputDecimals(convertedAssetAmount, _nativeAmount);
      }

      const _isSufficientBalance =
        Number(_assetAmount) <= Number(maxInputBalance);
      setAmountDetails({
        assetAmount: _assetAmount,
        isSufficientBalance: _isSufficientBalance,
        nativeAmount: _nativeAmount,
      });
      analytics.track('Changed native currency input in Send flow');
    },
    [maxInputBalance, selected.decimals, selected?.price?.value]
  );

  const sendMaxBalance = useCallback(async () => {
    const newBalanceAmount = await updateMaxInputBalance(selected);
    sendUpdateAssetAmount(newBalanceAmount);
  }, [selected, sendUpdateAssetAmount, updateMaxInputBalance]);

  const onChangeAssetAmount = useCallback(
    newAssetAmount => {
      if (isString(newAssetAmount)) {
        sendUpdateAssetAmount(newAssetAmount);
        analytics.track('Changed token input in Send flow');
      }
    },
    [sendUpdateAssetAmount]
  );

  useEffect(() => {
    const resolveAddressIfNeeded = async () => {
      let realAddress = recipient;
      const isValid = await checkIsValidAddressOrDomain(recipient);
      if (isValid) {
        realAddress = await resolveNameOrAddress(recipient);
      }
      setToAddress(realAddress);
    };
    recipient && resolveAddressIfNeeded();
  }, [recipient]);

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
      const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(
        txData,
        currentProvider
      );
      updateTxFee(updatedGasLimit, null, l1GasFeeOptimism);
    },
    [
      accountAddress,
      amountDetails.assetAmount,
      currentNetwork,
      currentProvider,
      selected,
      toAddress,
      updateTxFee,
    ]
  );

  const onSubmit = useCallback(async () => {
    const validTransaction =
      isValidAddress &&
      amountDetails.isSufficientBalance &&
      isSufficientGas &&
      isValidGas;
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
          if (currentNetwork === Network.optimism) {
            updateTxFeeForOptimism(updatedGasLimit);
          } else {
            updateTxFee(updatedGasLimit, null);
          }
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    const gasLimitToUse =
      updatedGasLimit && !lessThan(updatedGasLimit, gasLimit)
        ? updatedGasLimit
        : gasLimit;

    const gasParams = parseGasParamsForTransaction(selectedGasFee);
    const txDetails = {
      amount: amountDetails.assetAmount,
      asset: selected,
      from: accountAddress,
      gasLimit: gasLimitToUse,
      network: currentNetwork,
      nonce: await getNextNonce(),
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
        const { result: txResult } = await sendTransaction({
          provider: currentProvider,
          transaction: signableTransaction,
        });
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
          await dispatch(
            dataAddNewTransaction(txDetails, null, false, currentProvider)
          );
        }
      }
    } catch (error) {
      logger.sentry('TX Details', txDetails);
      logger.sentry('SendSheet onSubmit error');
      logger.sentry(error);
      captureException(error);
      submitSuccess = false;
    }
    return submitSuccess;
  }, [
    accountAddress,
    amountDetails.assetAmount,
    amountDetails.isSufficientBalance,
    currentNetwork,
    currentProvider,
    dataAddNewTransaction,
    dispatch,
    gasLimit,
    getNextNonce,
    isSufficientGas,
    isValidAddress,
    isValidGas,
    selected,
    selectedGasFee,
    toAddress,
    updateTxFee,
    updateTxFeeForOptimism,
  ]);

  const submitTransaction = useCallback(async () => {
    if (Number(amountDetails.assetAmount) <= 0) {
      logger.sentry('amountDetails.assetAmount ? ', amountDetails?.assetAmount);
      captureEvent('Preventing tx submit due to amount <= 0');
      return false;
    }
    const submitSuccessful = await onSubmit();
    analytics.track('Sent transaction', {
      assetName: selected?.name || '',
      assetType: selected?.type || '',
      isRecepientENS: toLower(recipient.slice(-4)) === '.eth',
    });

    if (submitSuccessful) {
      goBack();
      navigate(Routes.WALLET_SCREEN);
      InteractionManager.runAfterInteractions(() => {
        navigate(Routes.PROFILE_SCREEN);
      });
    }
  }, [
    amountDetails.assetAmount,
    goBack,
    navigate,
    onSubmit,
    recipient,
    selected?.name,
    selected?.type,
  ]);

  const validateRecipient = useCallback(
    async toAddress => {
      // Don't allow send to known ERC20 contracts on mainnet
      if (rainbowTokenList.RAINBOW_TOKEN_LIST[toLower(toAddress)]) {
        return false;
      }

      // Don't allow sending funds directly to known ERC20 contracts on L2
      if (isL2) {
        const currentChainAssets = chainAssets[currentNetwork];
        const found =
          currentChainAssets &&
          currentChainAssets.find(
            item => toLower(item.asset?.asset_code) === toLower(toAddress)
          );
        if (found) {
          return false;
        }
      }
      return true;
    },
    [currentNetwork, isL2]
  );

  const { buttonDisabled, buttonLabel } = useMemo(() => {
    const isZeroAssetAmount = Number(amountDetails.assetAmount) <= 0;

    let disabled = true;
    let label = lang.t('button.confirm_exchange.enter_amount');

    let nativeToken = 'ETH';
    if (currentNetwork === Network.polygon) {
      nativeToken = 'MATIC';
    }
    if (
      isEmpty(gasFeeParamsBySpeed) ||
      !selectedGasFee ||
      isEmpty(selectedGasFee?.gasFee)
    ) {
      label = lang.t('button.confirm_exchange.loading');
      disabled = true;
    } else if (!isZeroAssetAmount && !isSufficientGas) {
      disabled = true;
      label = lang.t('button.confirm_exchange.insufficient_token', {
        tokenName: nativeToken,
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
    currentNetwork,
    gasFeeParamsBySpeed,
    selectedGasFee,
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
    const validRecipient = await validateRecipient(toAddress);
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

    navigate(Routes.SEND_CONFIRMATION_SHEET, {
      amountDetails: amountDetails,
      asset: selected,
      callback: submitTransaction,
      isL2,
      isNft,
      network: currentNetwork,
      to: recipient,
      toAddress,
    });
  }, [
    amountDetails,
    assetInputRef,
    buttonDisabled,
    currentNetwork,
    isL2,
    isNft,
    nativeCurrencyInputRef,
    navigate,
    recipient,
    selected,
    submitTransaction,
    validateRecipient,
  ]);

  const onResetAssetSelection = useCallback(() => {
    analytics.track('Reset asset selection in Send flow');
    sendUpdateSelected({});
  }, [sendUpdateSelected]);

  const onChangeInput = useCallback(
    event => {
      setCurrentInput(event);
      setRecipient(event);
      setNickname(event);
      if (profilesEnabled && isENSAddressFormat(event)) {
        prefetchENSProfileImages(event);
      }
    },
    [profilesEnabled]
  );

  useEffect(() => {
    updateDefaultGasLimit();
  }, [updateDefaultGasLimit]);

  useEffect(() => {
    if (
      (isValidAddress && showAssetList) ||
      (isValidAddress && showAssetForm && selected?.type === AssetTypes.nft)
    ) {
      Keyboard.dismiss();
    }
  }, [isValidAddress, selected, showAssetForm, showAssetList]);

  const checkAddress = useCallback(async recipient => {
    if (recipient) {
      const validAddress = await checkIsValidAddressOrDomain(recipient);
      setIsValidAddress(validAddress);
    }
  }, []);

  const [ensSuggestions, setEnsSuggestions] = useState([]);
  useEffect(() => {
    if (network === Network.mainnet && !recipientOverride) {
      debouncedFetchSuggestions(
        recipient,
        setEnsSuggestions,
        undefined,
        profilesEnabled
      );
    } else {
      setEnsSuggestions([]);
    }
  }, [
    network,
    recipient,
    recipientOverride,
    setEnsSuggestions,
    watchedAccounts,
    profilesEnabled,
  ]);

  useEffect(() => {
    checkAddress(recipient);
  }, [checkAddress, recipient]);

  useEffect(() => {
    if (!currentProvider?._network?.chainId) return;
    const currentProviderNetwork = ethereumUtils.getNetworkFromChainId(
      Number(currentProvider._network.chainId)
    );
    const assetNetwork = isL2Asset(selected?.type) ? selected.type : network;
    if (
      assetNetwork === currentNetwork &&
      currentProviderNetwork === currentNetwork &&
      isValidAddress &&
      !isEmpty(selected)
    ) {
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
          if (currentNetwork === Network.optimism) {
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
  ]);

  const sendContactListDataKey = useMemo(
    () => `${ensSuggestions?.[0]?.address || '_'}`,
    [ensSuggestions]
  );

  return (
    <Container>
      {ios && <StatusBar barStyle="light-content" />}
      <SheetContainer>
        <SendHeader
          contacts={contacts}
          fromProfile={params?.fromProfile}
          hideDivider={showAssetForm}
          isValidAddress={isValidAddress}
          nickname={nickname}
          onChangeAddressInput={onChangeInput}
          onPressPaste={setRecipient}
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
            onPressContact={(recipient, nickname) => {
              setRecipient(recipient);
              setNickname(nickname);
            }}
            removeContact={onRemoveContact}
            userAccounts={userAccounts}
            watchedAccounts={watchedAccounts}
          />
        )}
        {showAssetList && (
          <SendAssetList
            hiddenCoins={hiddenCoinsObj}
            nativeCurrency={nativeCurrency}
            network={network}
            onSelectAsset={sendUpdateSelected}
            pinnedCoins={pinnedCoinsObj}
            savings={savings}
            sortedAssets={sortedAssets}
            uniqueTokens={sendableUniqueTokens}
          />
        )}
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
            nativeAmount={amountDetails.nativeAmount}
            nativeCurrency={nativeCurrency}
            nativeCurrencyInputRef={nativeCurrencyInputRef}
            onChangeAssetAmount={onChangeAssetAmount}
            onChangeNativeAmount={onChangeNativeAmount}
            onResetAssetSelection={onResetAssetSelection}
            selected={selected}
            sendMaxBalance={sendMaxBalance}
            setLastFocusedInputHandle={setLastFocusedInputHandle}
            txSpeedRenderer={
              <GasSpeedButton
                asset={selected}
                currentNetwork={currentNetwork}
                horizontalPadding={0}
                marginBottom={17}
                theme={isDarkMode ? 'dark' : 'light'}
              />
            }
          />
        )}
        {android && showAssetForm ? (
          <KeyboardSizeView showAssetForm={showAssetForm} />
        ) : null}
      </SheetContainer>
    </Container>
  );
}
