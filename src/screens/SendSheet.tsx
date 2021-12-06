import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { captureEvent, captureException } from '@sentry/react-native';
import { isEmpty, isEqual, isString, toLower } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, InteractionManager, Keyboard, StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { KeyboardArea } from 'react-native-keyboard-area';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '../.... Remove this comment to see the full error message
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
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { AssetTypes } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/assets' o... Remove this comment to see the full error message
import { isL2Asset, isNativeAsset } from '@rainbow-me/handlers/assets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/ens' or i... Remove this comment to see the full error message
import { debouncedFetchSuggestions } from '@rainbow-me/handlers/ens';
import {
  buildTransaction,
  createSignableTransaction,
  estimateGasLimit,
  getProviderForNetwork,
  isL2Network,
  resolveNameOrAddress,
  web3Provider,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
} from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/isNativeSt... Remove this comment to see the full error message
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/validators... Remove this comment to see the full error message
import { checkIsValidAddressOrDomain } from '@rainbow-me/helpers/validators';
import {
  useAccountAssets,
  useAccountSettings,
  useCoinListEditOptions,
  useColorForAsset,
  useContacts,
  useCurrentNonce,
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
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/model/wallet' or i... Remove this comment to see the full error message
import { sendTransaction } from '@rainbow-me/model/wallet';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation/Navigat... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation/Navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/parsers' or its co... Remove this comment to see the full error message
import { parseGasParamsForTransaction } from '@rainbow-me/parsers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { chainAssets, rainbowTokenList } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders } from '@rainbow-me/styles';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountFromNativeValue,
  formatInputDecimals,
  lessThan,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
} from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { deviceUtils, ethereumUtils } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const sheetHeight = deviceUtils.dimensions.height - (android ? 30 : 10);
const statusBarHeight = getStatusBarHeight(true);

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View`
  background-color: ${({ theme: { colors } }: any) => colors.transparent};
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
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  height: ${isNativeStackAvailable || android ? sheetHeight : '100%'};
  width: 100%;
`;

const KeyboardSizeView = styled(KeyboardArea)`
  width: 100%;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'showAssetForm' does not exist on type 'I... Remove this comment to see the full error message
  background-color: ${({ showAssetForm, theme: { colors } }) =>
    showAssetForm ? colors.lighterGrey : colors.white};
`;

export default function SendSheet(props: any) {
  const dispatch = useDispatch();
  const { goBack, navigate, addListener } = useNavigation();
  const { dataAddNewTransaction } = useTransactionConfirmation();
  const updateAssetOnchainBalanceIfNeeded = useUpdateAssetOnchainBalance();
  const { allAssets } = useAccountAssets();
  const {
    gasFeeParamsBySpeed,
    gasLimit,
    isSufficientGas,
    prevSelectedGasFee,
    selectedGasFee,
    startPollingGasFees,
    stopPollingGasFees,
    updateDefaultGasLimit,
    updateTxFee,
  } = useGas();
  const isDismissing = useRef(false);
  const recipientFieldRef = useRef();

  const { contacts, onRemoveContact, filteredContacts } = useContacts();
  const { userAccounts, watchedAccounts } = useUserAccounts();
  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const { accountAddress, nativeCurrency, network } = useAccountSettings();
  const getNextNonce = useCurrentNonce(accountAddress, network);

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
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'asset' does not exist on type 'object'.
  const assetOverride = params?.asset;
  const prevAssetOverride = usePrevious(assetOverride);

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'address' does not exist on type 'object'... Remove this comment to see the full error message
  const recipientOverride = params?.address;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'nativeAmount' does not exist on type 'ob... Remove this comment to see the full error message
  const nativeAmountOverride = params?.nativeAmount;
  const [recipient, setRecipient] = useState('');
  const [selected, setSelected] = useState({});
  const { maxInputBalance, updateMaxInputBalance } = useMaxInputBalance();

  const [isValidAddress, setIsValidAddress] = useState(!!recipientOverride);
  const [currentProvider, setCurrentProvider] = useState();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors, isDarkMode } = useTheme();

  const showEmptyState = !isValidAddress;
  const showAssetList = isValidAddress && isEmpty(selected);
  const showAssetForm = isValidAddress && !isEmpty(selected);

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
  const isNft = selected?.type === AssetTypes.nft;
  let colorForAsset = useColorForAsset(
    {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'mainnet_address' does not exist on type ... Remove this comment to see the full error message
      address: selected?.mainnet_address || selected.address,
    },
    null,
    false,
    true
  );
  if (isNft) {
    colorForAsset = colors.appleBlue;
  }

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const isL2 = useMemo(() => {
    return isL2Network(currentNetwork);
  }, [currentNetwork]);

  const { triggerFocus } = useMagicAutofocus(recipientFieldRef);

  useEffect(() => {
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    if (ios) {
      return;
    }
    dismissingScreenListener.current = () => {
      Keyboard.dismiss();
      isDismissing.current = true;
    };
    const unsubscribe = addListener(
      'transitionEnd',
      ({ data: { closing } }: any) => {
        if (!closing && isDismissing.current) {
          isDismissing.current = false;
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
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
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'price' does not exist on type '{}'.
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
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'uniqueId' does not exist on type '{}'.
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
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
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'isNativeAsset' does not exist on type '{... Remove this comment to see the full error message
      selected?.isNativeAsset &&
      (prevSelectedGasFee?.gasFee?.estimatedFee?.value?.amount ?? 0) !==
        (selectedGasFee?.gasFee?.estimatedFee?.value?.amount ?? 0)
    ) {
      updateMaxInputBalance(selected);
    }
  }, [prevSelectedGasFee, selected, selectedGasFee, updateMaxInputBalance]);

  useEffect(() => {
    const updateNetworkAndProvider = async () => {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
      const assetNetwork = isL2Asset(selected?.type) ? selected.type : network;
      if (
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
        selected?.type &&
        (assetNetwork !== currentNetwork ||
          !currentNetwork ||
          prevNetwork !== currentNetwork)
      ) {
        let provider = web3Provider;
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
  }, [currentNetwork, network, prevNetwork, selected.type, sendUpdateSelected]);

  useEffect(() => {
    if (isEmpty(selected)) return;
    // @ts-expect-error ts-migrate(2339) FIXME: Property '_network' does not exist on type 'never'... Remove this comment to see the full error message
    if (currentProvider?._network?.chainId) {
      const currentProviderNetwork = ethereumUtils.getNetworkFromChainId(
        // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
        currentProvider._network.chainId
      );

      // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
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
          (updatedAsset: any) => {
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
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'price' does not exist on type '{}'.
        const priceUnit = selected?.price?.value ?? 0;
        const convertedAssetAmount = convertAmountFromNativeValue(
          _nativeAmount,
          priceUnit,
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'decimals' does not exist on type '{}'.
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
      const isValid = await checkIsValidAddressOrDomain(recipient);
      if (isValid) {
        realAddress = await resolveNameOrAddress(recipient);
      }
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
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
      updateTxFee(updatedGasLimit, null, currentNetwork, l1GasFeeOptimism);
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
      isValidAddress && amountDetails.isSufficientBalance && isSufficientGas;
    if (!selectedGasFee?.gasFee?.estimatedFee || !validTransaction) {
      logger.sentry('preventing tx submit for one of the following reasons:');
      logger.sentry('selectedGasFee ? ', selectedGasFee);
      logger.sentry('selectedGasFee.maxFee ? ', selectedGasFee?.maxFee);
      logger.sentry('validTransaction ? ', validTransaction);
      // @ts-expect-error ts-migrate(2559) FIXME: Type '"Preventing tx submit"' has no properties in... Remove this comment to see the full error message
      captureEvent('Preventing tx submit');
      return false;
    }

    let submitSuccess = false;
    let updatedGasLimit = null;

    // Attempt to update gas limit before sending ERC20 / ERC721
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'address' does not exist on type '{}'.
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
          if (network === networkTypes.optimism) {
            updateTxFeeForOptimism(updatedGasLimit);
          } else {
            updateTxFee(updatedGasLimit, null, currentNetwork);
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
        Alert.alert('Invalid transaction');
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
    network,
    selected,
    selectedGasFee,
    toAddress,
    updateTxFee,
    updateTxFeeForOptimism,
  ]);

  const submitTransaction = useCallback(async () => {
    if (Number(amountDetails.assetAmount) <= 0) {
      logger.sentry('amountDetails.assetAmount ? ', amountDetails?.assetAmount);
      // @ts-expect-error ts-migrate(2559) FIXME: Type '"Preventing tx submit due to amount <= 0"' h... Remove this comment to see the full error message
      captureEvent('Preventing tx submit due to amount <= 0');
      return false;
    }
    const submitSuccessful = await onSubmit();
    analytics.track('Sent transaction', {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'name' does not exist on type '{}'.
      assetName: selected?.name || '',
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'name' does not exist on type '{}'.
    selected?.name,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
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
        const found = currentChainAssets.find(
          (item: any) => toLower(item.asset?.asset_code) === toLower(toAddress)
        );
        if (found) {
          return false;
        }
      }
      return true;
    },
    [currentNetwork, isL2]
  );

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const { buttonDisabled, buttonLabel } = useMemo(() => {
    const isZeroAssetAmount = Number(amountDetails.assetAmount) <= 0;

    let disabled = true;
    let label = 'Enter an Amount';

    let nativeToken = 'ETH';
    if (network === networkTypes.polygon) {
      nativeToken = 'MATIC';
    }
    if (
      isEmpty(gasFeeParamsBySpeed) ||
      !selectedGasFee ||
      isEmpty(selectedGasFee?.gasFee)
    ) {
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
    gasFeeParamsBySpeed,
    isSufficientGas,
    network,
    selectedGasFee,
  ]);

  const showConfirmationSheet = useCallback(async () => {
    if (buttonDisabled) return;
    let toAddress = recipient;
    const isValid = await checkIsValidAddressOrDomain(recipient);
    if (isValid) {
      toAddress = await resolveNameOrAddress(recipient);
    }
    const validRecipient = await validateRecipient(toAddress);

    if (!validRecipient) {
      navigate(Routes.EXPLAIN_SHEET, {
        onClose: () => {
          // Nasty workaround to take control over useMagicAutofocus :S
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
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
    buttonDisabled,
    currentNetwork,
    isL2,
    isNft,
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

  const onChangeInput = useCallback(event => {
    setCurrentInput(event);
    setRecipient(event);
  }, []);

  useEffect(() => {
    updateDefaultGasLimit();
  }, [updateDefaultGasLimit]);

  useEffect(() => {
    if (
      (isValidAddress && showAssetList) ||
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property '_network' does not exist on type 'never'... Remove this comment to see the full error message
    if (!currentProvider?._network?.chainId) return;
    const currentProviderNetwork = ethereumUtils.getNetworkFromChainId(
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
      currentProvider._network.chainId
    );
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
    const assetNetwork = isL2Asset(selected?.type) ? selected.type : network;
    if (
      assetNetwork === currentNetwork &&
      currentProviderNetwork === currentNetwork &&
      isValidAddress &&
      !isEmpty(selected) &&
      !isEmpty(gasFeeParamsBySpeed)
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
        .then(async (gasLimit: any) => {
          if (currentNetwork === networkTypes.optimism) {
            updateTxFeeForOptimism(gasLimit);
          } else {
            updateTxFee(gasLimit, null, currentNetwork);
          }
        })
        .catch((e: any) => {
          logger.sentry('Error getting optimism l1 fee', e);
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
    updateTxFeeForOptimism,
    network,
    gasFeeParamsBySpeed,
  ]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <StatusBar barStyle="light-content" />}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SheetContainer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <SendAssetForm
            {...props}
            assetAmount={amountDetails.assetAmount}
            buttonRenderer={
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
            onChangeAssetAmount={onChangeAssetAmount}
            onChangeNativeAmount={onChangeNativeAmount}
            onResetAssetSelection={onResetAssetSelection}
            selected={selected}
            sendMaxBalance={sendMaxBalance}
            txSpeedRenderer={
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <GasSpeedButton
                asset={selected}
                currentNetwork={currentNetwork}
                horizontalPadding={0}
                theme={isDarkMode ? 'dark' : 'light'}
              />
            }
          />
        )}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        {android && showAssetForm ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <KeyboardSizeView showAssetForm={showAssetForm} />
        ) : null}
      </SheetContainer>
    </Container>
  );
}
