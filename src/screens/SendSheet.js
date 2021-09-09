import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { captureEvent, captureException } from '@sentry/react-native';
import { isEmpty, isEqual, isString, toLower } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager, Keyboard, StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { KeyboardArea } from 'react-native-keyboard-area';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { dismissingScreenListener } from '../../shim';
import { GasSpeedButton } from '../components/gas';
import { Column } from '../components/layout';
import {
  SendAssetForm,
  SendAssetList,
  SendContactList,
  SendHeader,
} from '../components/send';
import { SheetActionButton } from '../components/sheet';
import { AssetTypes } from '@rainbow-me/entities';
import { isL2Asset, isNativeAsset } from '@rainbow-me/handlers/assets';
import { debouncedFetchSuggestions } from '@rainbow-me/handlers/ens';
import {
  createSignableTransaction,
  estimateGasLimit,
  getProviderForNetwork,
  isL2Network,
  resolveNameOrAddress,
  web3Provider,
} from '@rainbow-me/handlers/web3';
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  checkIsValidAddressOrDomain,
  isENSAddressFormat,
} from '@rainbow-me/helpers/validators';
import {
  useAccountAssets,
  useAccountSettings,
  useCoinListEditOptions,
  useColorForAsset,
  useContacts,
  useDimensions,
  useGas,
  useMagicAutofocus,
  useMaxInputBalance,
  usePrevious,
  useRefreshAccountData,
  useSendableUniqueTokens,
  useSendSavingsAccount,
  useTransactionConfirmation,
  useUpdateAssetOnchainBalance,
  useUserAccounts,
} from '@rainbow-me/hooks';
import { sendTransaction } from '@rainbow-me/model/wallet';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import {
  chainAssets,
  ETH_ADDRESS,
  RAINBOW_TOKEN_LIST,
} from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
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

const Container = styled.View`
  background-color: ${({ theme: { colors } }) => colors.transparent};
  flex: 1;
  padding-top: ${isNativeStackAvailable ? 0 : statusBarHeight};
  width: 100%;
`;

const SheetContainer = styled(Column).attrs({
  align: 'center',
  flex: 1,
})`
  ${borders.buildRadius('top', isNativeStackAvailable ? 0 : 16)};
  background-color: ${({ theme: { colors } }) => colors.white};
  height: ${isNativeStackAvailable || android ? sheetHeight : '100%'};
  width: 100%;
`;

const KeyboardSizeView = styled(KeyboardArea)`
  width: 100%;
  background-color: ${({ showAssetForm, theme: { colors } }) =>
    showAssetForm ? colors.lighterGrey : colors.white};
`;

export default function SendSheet(props) {
  const dispatch = useDispatch();
  const { deviceWidth, isTinyPhone } = useDimensions();
  const { goBack, navigate, addListener } = useNavigation();
  const { dataAddNewTransaction } = useTransactionConfirmation();
  const updateAssetOnchainBalanceIfNeeded = useUpdateAssetOnchainBalance();
  const { allAssets } = useAccountAssets();
  const {
    gasLimit,
    gasPrices,
    isSufficientGas,
    prevSelectedGasPrice,
    selectedGasPrice,
    startPollingGasPrices,
    stopPollingGasPrices,
    txFees,
    updateDefaultGasLimit,
    updateTxFee,
  } = useGas();
  const isDismissing = useRef(false);

  const recipientFieldRef = useRef();

  const { contacts, onRemoveContact, filteredContacts } = useContacts();
  const { userAccounts, watchedAccounts } = useUserAccounts();
  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const { accountAddress, nativeCurrency, network } = useAccountSettings();

  const savings = useSendSavingsAccount();
  const fetchData = useRefreshAccountData();
  const { hiddenCoins, pinnedCoins } = useCoinListEditOptions();
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
  const [selected, setSelected] = useState({});
  const { maxInputBalance, updateMaxInputBalance } = useMaxInputBalance();

  const [isValidAddress, setIsValidAddress] = useState(!!recipientOverride);
  const [currentProvider, setCurrentProvider] = useState();
  const { colors, isDarkMode } = useTheme();

  const showEmptyState = !isValidAddress;
  const showAssetList = isValidAddress && isEmpty(selected);
  const showAssetForm = isValidAddress && !isEmpty(selected);

  const isNft = selected?.type === AssetTypes.nft;
  let color = useColorForAsset({
    address: selected?.mainnet_address || selected.address,
  });
  if (isNft) {
    color = colors.appleBlue;
  }

  const isL2 = useMemo(() => {
    return isL2Network(currentNetwork);
  }, [currentNetwork]);

  const { triggerFocus } = useMagicAutofocus(recipientFieldRef);

  useEffect(() => {
    if (ios) {
      return;
    }
    dismissingScreenListener.current = () => {
      Keyboard.dismiss();
      isDismissing.current = true;
    };
    const unsubscribe = addListener(
      'transitionEnd',
      ({ data: { closing } }) => {
        if (!closing && isDismissing.current) {
          isDismissing.current = false;
          recipientFieldRef?.current?.focus();
        }
      }
    );
    return () => {
      unsubscribe();
      dismissingScreenListener.current = undefined;
    };
  }, [addListener]);

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
        startPollingGasPrices(currentNetwork);
      });
    }
  }, [currentNetwork, prevNetwork, startPollingGasPrices]);

  // Stop polling when the sheet is unmounted
  useEffect(() => {
    return () => {
      InteractionManager.runAfterInteractions(() => {
        stopPollingGasPrices();
      });
    };
  }, [stopPollingGasPrices]);

  // Recalculate balance when gas price changes
  useEffect(() => {
    if (
      selected?.address === ETH_ADDRESS &&
      (prevSelectedGasPrice?.txFee?.value?.amount ?? 0) !==
        (selectedGasPrice?.txFee?.value?.amount ?? 0)
    ) {
      updateMaxInputBalance(selected);
    }
  }, [prevSelectedGasPrice, selected, selectedGasPrice, updateMaxInputBalance]);

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
            setCurrentNetwork(networkTypes.polygon);
            provider = await getProviderForNetwork(networkTypes.polygon);
            break;
          case AssetTypes.arbitrum:
            setCurrentNetwork(networkTypes.arbitrum);
            provider = await getProviderForNetwork(networkTypes.arbitrum);
            break;
          case AssetTypes.optimism:
            setCurrentNetwork(networkTypes.optimism);
            provider = await getProviderForNetwork(networkTypes.optimism);
            break;
          default:
            setCurrentNetwork(network);
        }
        setCurrentProvider(provider);
      }
    };
    updateNetworkAndProvider();
  }, [
    currentNetwork,
    network,
    prevNetwork,
    selected,
    selected.type,
    sendUpdateSelected,
  ]);

  useEffect(() => {
    if (isEmpty(selected)) return;
    if (currentProvider?._network?.chainId) {
      const currentProviderNetwork = ethereumUtils.getNetworkFromChainId(
        currentProvider._network.chainId
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
    [maxInputBalance, selected]
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
      if (isENSAddressFormat(recipient)) {
        realAddress = await resolveNameOrAddress(recipient);
      }
      setToAddress(realAddress);
    };
    resolveAddressIfNeeded();
  }, [recipient]);

  const onSubmit = useCallback(async () => {
    const validTransaction =
      isValidAddress && amountDetails.isSufficientBalance && isSufficientGas;
    if (!selectedGasPrice.txFee || !validTransaction) {
      logger.sentry('preventing tx submit for one of the following reasons:');
      logger.sentry('selectedGasPrice.txFee ? ', selectedGasPrice?.txFee);
      logger.sentry('validTransaction ? ', validTransaction);
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
          updateTxFee(updatedGasLimit, null, currentNetwork);
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    const gasLimitToUse =
      updatedGasLimit && !lessThan(updatedGasLimit, gasLimit)
        ? updatedGasLimit
        : gasLimit;

    logger.log('gasLimit', gasLimitToUse);
    const txDetails = {
      amount: amountDetails.assetAmount,
      asset: selected,
      from: accountAddress,
      gasLimit: gasLimitToUse,
      gasPrice: selectedGasPrice.value?.amount,
      nonce: null,
      to: toAddress,
    };
    try {
      const signableTransaction = await createSignableTransaction(txDetails);
      const { result: txResult } = await sendTransaction({
        provider: currentProvider,
        transaction: signableTransaction,
      });
      const { hash, nonce } = txResult;
      if (!isEmpty(hash)) {
        submitSuccess = true;
        txDetails.hash = hash;
        txDetails.nonce = nonce;
        txDetails.network = currentNetwork;
        await dispatch(
          dataAddNewTransaction(txDetails, null, false, currentProvider)
        );
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
    isSufficientGas,
    isValidAddress,
    selected,
    selectedGasPrice,
    toAddress,
    updateTxFee,
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
      if (RAINBOW_TOKEN_LIST[toLower(toAddress)]) {
        return false;
      }

      // Don't allow sending funds directly to known ERC20 contracts on L2
      if (isL2) {
        const currentChainAssets = chainAssets[currentNetwork];
        const found = currentChainAssets.find(
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
    let label = 'Enter an Amount';

    let nativeToken = 'ETH';
    if (network === networkTypes.polygon) {
      nativeToken = 'MATIC';
    }

    if (isEmpty(gasPrices) || !selectedGasPrice || isEmpty(txFees)) {
      label = `Loading...`;
      disabled = true;
    } else if (!isZeroAssetAmount && !isSufficientGas) {
      disabled = true;
      label = `Insufficient ${nativeToken}`;
    } else if (!isZeroAssetAmount && !amountDetails.isSufficientBalance) {
      disabled = true;
      label = 'Insufficient Funds';
    } else if (!isZeroAssetAmount) {
      disabled = false;
      label = '􀕹 Review';
    }

    return { buttonDisabled: disabled, buttonLabel: label };
  }, [
    amountDetails.assetAmount,
    amountDetails.isSufficientBalance,
    gasPrices,
    isSufficientGas,
    network,
    selectedGasPrice,
    txFees,
  ]);

  const showConfirmationSheet = useCallback(async () => {
    if (buttonDisabled) return;
    let toAddress = recipient;
    if (isENSAddressFormat(recipient)) {
      toAddress = await resolveNameOrAddress(recipient);
    }
    const validRecipient = await validateRecipient(toAddress);

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
      currentInput,
      from: accountAddress,
      gasLimit: gasLimit,
      gasPrice: selectedGasPrice.value?.amount,
      isL2,
      isNft,
      isSufficientGas,
      network: currentNetwork,
      to: recipient,
      toAddress,
    });
  }, [
    accountAddress,
    amountDetails,
    buttonDisabled,
    currentInput,
    currentNetwork,
    gasLimit,
    isL2,
    isNft,
    isSufficientGas,
    navigate,
    recipient,
    selected,
    selectedGasPrice.value?.amount,
    submitTransaction,
    validateRecipient,
  ]);

  const onResetAssetSelection = useCallback(() => {
    analytics.track('Reset asset selection in Send flow');
    sendUpdateSelected({});
  }, [sendUpdateSelected]);

  const onChangeInput = useCallback(event => {
    setCurrentInput(event);
    setRecipient(event);
  }, []);

  useEffect(() => {
    updateDefaultGasLimit(network);
  }, [updateDefaultGasLimit, network]);

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
    if (network === networkTypes.mainnet && !recipientOverride) {
      debouncedFetchSuggestions(recipient, setEnsSuggestions);
    } else {
      setEnsSuggestions([]);
    }
  }, [
    network,
    recipient,
    recipientOverride,
    setEnsSuggestions,
    watchedAccounts,
  ]);

  useEffect(() => {
    checkAddress(recipient);
  }, [checkAddress, recipient]);

  useEffect(() => {
    if (!currentProvider?._network?.chainId) return;
    const currentProviderNetwork = ethereumUtils.getNetworkFromChainId(
      currentProvider._network.chainId
    );
    const assetNetwork = isL2Asset(selected?.type) ? selected.type : network;

    if (
      assetNetwork === currentNetwork &&
      currentProviderNetwork === currentNetwork &&
      isValidAddress &&
      !isEmpty(selected) &&
      !isEmpty(gasPrices)
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
        .then(gasLimit => {
          updateTxFee(gasLimit, null, currentNetwork);
        })
        .catch(() => {
          updateTxFee(null, null, currentNetwork);
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
    network,
    gasPrices,
  ]);

  return (
    <Container>
      {ios && <StatusBar barStyle="light-content" />}
      <SheetContainer>
        <SendHeader
          contacts={contacts}
          hideDivider={showAssetForm}
          isValidAddress={isValidAddress}
          onChangeAddressInput={onChangeInput}
          onPressPaste={setRecipient}
          onRefocusInput={triggerFocus}
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
            onPressContact={setRecipient}
            removeContact={onRemoveContact}
            userAccounts={userAccounts}
            watchedAccounts={watchedAccounts}
          />
        )}
        {showAssetList && (
          <SendAssetList
            allAssets={allAssets}
            fetchData={fetchData}
            hiddenCoins={hiddenCoins}
            nativeCurrency={nativeCurrency}
            network={network}
            onSelectAsset={sendUpdateSelected}
            pinnedCoins={pinnedCoins}
            savings={savings}
            uniqueTokens={sendableUniqueTokens}
          />
        )}
        {showAssetForm && (
          <SendAssetForm
            {...props}
            assetAmount={amountDetails.assetAmount}
            buttonRenderer={
              <SheetActionButton
                androidWidth={deviceWidth - 60}
                color={color}
                disabled={buttonDisabled}
                forceShadows
                fullWidth
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
            onChangeAssetAmount={onChangeAssetAmount}
            onChangeNativeAmount={onChangeNativeAmount}
            onResetAssetSelection={onResetAssetSelection}
            selected={selected}
            sendMaxBalance={sendMaxBalance}
            txSpeedRenderer={
              <GasSpeedButton
                currentNetwork={currentNetwork}
                horizontalPadding={isTinyPhone ? 0 : 5}
                options={
                  currentNetwork === networkTypes.optimism ||
                  currentNetwork === networkTypes.arbitrum
                    ? ['normal']
                    : undefined
                }
                theme={isDarkMode ? 'dark' : 'light'}
                topPadding={isTinyPhone ? 8 : 15}
                type="transaction"
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
