import analytics from '@segment/analytics-react-native';
import { get, isEmpty, isString, toLower } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import {
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { getStatusBarHeight, isIphoneX } from 'react-native-iphone-x-helper';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import { Column } from '../components/layout';
import {
  SendAssetForm,
  SendAssetList,
  SendButton,
  SendContactList,
  SendHeader,
  SendTransactionSpeed,
} from '../components/send';
import { createSignableTransaction, estimateGasLimit } from '../handlers/web3';
import AssetTypes from '../helpers/assetTypes';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountFromNativeValue,
  formatInputDecimals,
} from '../helpers/utilities';
import { checkIsValidAddress } from '../helpers/validators';
import {
  useAccountAssets,
  useAccountSettings,
  useGas,
  usePrevious,
  useRefreshAccountData,
  useSendableUniqueTokens,
  useSendSavingsAccount,
} from '../hooks';
import { sendTransaction } from '../model/wallet';
import { borders, colors } from '../styles';
import { deviceUtils, ethereumUtils, gasUtils } from '../utils';

const sheetHeight = deviceUtils.dimensions.height - 10;

const Container = styled(Column)`
  background-color: ${colors.transparent};
  height: 100%;
`;

const statusBarHeight = getStatusBarHeight(true);

const SheetContainer = isNativeStackAvailable
  ? styled(Column)`
      background-color: ${colors.white};
      height: ${sheetHeight};
    `
  : styled(Column)`
      ${borders.buildRadius('top', 16)};
      background-color: ${colors.white};
      height: 100%;
      top: ${statusBarHeight};
    `;

const SendSheet = ({
  contacts,
  dataAddNewTransaction,
  gasLimit,
  gasPrices,
  gasPricesStartPolling,
  gasPricesStopPolling,
  gasUpdateDefaultGasLimit,
  gasUpdateGasPriceOption,
  gasUpdateTxFee,
  isSufficientGas,
  removeContact,
  setAppearListener,
  sortedContacts,
  txFees,
  ...props
}) => {
  const { allAssets } = useAccountAssets();
  const { selectedGasPrice } = useGas();
  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const {
    accountAddress,
    nativeCurrency,
    nativeCurrencySymbol,
  } = useAccountSettings();

  const savings = useSendSavingsAccount();
  const fetchData = useRefreshAccountData();

  const { navigate } = useNavigation();
  const [amountDetails, setAmountDetails] = useState({
    assetAmount: '',
    isSufficientBalance: false,
    nativeAmount: '',
  });
  const [currentInput, setCurrentInput] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [selected, setSelected] = useState({});
  const [balanceAmount, setBalanceAmount] = useState(0);

  const showEmptyState = !isValidAddress;
  const showAssetList = isValidAddress && isEmpty(selected);
  const showAssetForm = isValidAddress && !isEmpty(selected);
  const prevSelectedGasPrice = usePrevious(selectedGasPrice);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      gasPricesStartPolling();
    });
    return () => {
      InteractionManager.runAfterInteractions(() => {
        gasPricesStopPolling();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateBalanceAmount = useCallback(
    async newSelected => {
      const currentBalanceAmount = await ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        newSelected,
        true,
        accountAddress
      );
      setBalanceAmount(currentBalanceAmount);
    },
    [accountAddress, selectedGasPrice]
  );

  // Recalculate balance when gas price changes
  useEffect(() => {
    if (
      selected.address === 'eth' &&
      get(prevSelectedGasPrice, 'txFee.value.amount', 0) !==
        get(selectedGasPrice, 'txFee.value.amount', 0)
    ) {
      updateBalanceAmount(selected);
    }
  }, [prevSelectedGasPrice, selected, selectedGasPrice, updateBalanceAmount]);

  const sendUpdateAssetAmount = useCallback(
    newAssetAmount => {
      const _assetAmount = newAssetAmount.replace(/[^0-9.]/g, '');
      let _nativeAmount = '';
      if (_assetAmount.length) {
        const priceUnit = get(selected, 'price.value', 0);
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
        Number(_assetAmount) <= Number(balanceAmount);
      setAmountDetails({
        assetAmount: _assetAmount,
        isSufficientBalance: _isSufficientBalance,
        nativeAmount: _nativeAmount,
      });
    },
    [balanceAmount, nativeCurrency, selected]
  );

  const sendUpdateSelected = useCallback(
    newSelected => {
      updateBalanceAmount(newSelected);
      if (get(newSelected, 'type') === AssetTypes.nft) {
        setAmountDetails({
          assetAmount: '1',
          isSufficientBalance: true,
          nativeAmount: '0',
        });
        setSelected({
          ...newSelected,
          symbol: get(newSelected, 'asset_contract.name'),
        });
      } else {
        setSelected(newSelected);
        sendUpdateAssetAmount('');
      }
    },
    [sendUpdateAssetAmount, updateBalanceAmount]
  );

  const sendUpdateRecipient = useCallback(newRecipient => {
    setRecipient(newRecipient);
  }, []);

  const onChangeNativeAmount = useCallback(
    newNativeAmount => {
      if (!isString(newNativeAmount)) return;
      const _nativeAmount = newNativeAmount.replace(/[^0-9.]/g, '');
      let _assetAmount = '';
      if (_nativeAmount.length) {
        const priceUnit = get(selected, 'price.value', 0);
        const convertedAssetAmount = convertAmountFromNativeValue(
          _nativeAmount,
          priceUnit,
          selected.decimals
        );
        _assetAmount = formatInputDecimals(convertedAssetAmount, _nativeAmount);
      }

      const _isSufficientBalance =
        Number(_assetAmount) <= Number(balanceAmount);

      setAmountDetails({
        assetAmount: _assetAmount,
        isSufficientBalance: _isSufficientBalance,
        nativeAmount: _nativeAmount,
      });
      analytics.track('Changed native currency input in Send flow');
    },
    [balanceAmount, selected]
  );

  const sendMaxBalance = useCallback(async () => {
    const balanceAmount = await ethereumUtils.getBalanceAmount(
      selectedGasPrice,
      selected,
      true,
      accountAddress
    );
    setBalanceAmount(balanceAmount);
    sendUpdateAssetAmount(balanceAmount);
  }, [accountAddress, selected, selectedGasPrice, sendUpdateAssetAmount]);

  const onChangeAssetAmount = useCallback(
    newAssetAmount => {
      if (isString(newAssetAmount)) {
        sendUpdateAssetAmount(newAssetAmount);
        analytics.track('Changed token input in Send flow');
      }
    },
    [sendUpdateAssetAmount]
  );

  const onSubmit = useCallback(async () => {
    const validTransaction =
      isValidAddress && amountDetails.isSufficientBalance && isSufficientGas;
    if (!selectedGasPrice.txFee || !validTransaction || isAuthorizing)
      return false;

    let submitSuccess = false;

    const txDetails = {
      amount: amountDetails.assetAmount,
      asset: selected,
      from: accountAddress,
      gasLimit,
      gasPrice: get(selectedGasPrice, 'value.amount'),
      nonce: null,
      to: recipient,
    };
    try {
      const signableTransaction = await createSignableTransaction(txDetails);
      const txHash = await sendTransaction({
        transaction: signableTransaction,
      });
      if (!isEmpty(txHash)) {
        submitSuccess = true;
        txDetails.hash = txHash;
        await dataAddNewTransaction(txDetails);
      }
    } catch (error) {
      submitSuccess = false;
    } finally {
      setIsAuthorizing(false);
    }
    return submitSuccess;
  }, [
    accountAddress,
    amountDetails.assetAmount,
    amountDetails.isSufficientBalance,
    dataAddNewTransaction,
    gasLimit,
    isAuthorizing,
    isSufficientGas,
    isValidAddress,
    recipient,
    selected,
    selectedGasPrice,
  ]);

  const submitTransaction = useCallback(async () => {
    if (Number(amountDetails.assetAmount) <= 0) return false;

    try {
      const submitSuccessful = await onSubmit();
      analytics.track('Sent transaction', {
        assetName: selected.name,
        assetType: selected.type,
        isRecepientENS: toLower(recipient.slice(-4)) === '.eth',
      });
      if (submitSuccessful) {
        navigate('ProfileScreen');
      }
    } catch (error) {
      setIsAuthorizing(false);
    }
  }, [
    amountDetails.assetAmount,
    navigate,
    onSubmit,
    recipient,
    selected.name,
    selected.type,
  ]);

  const onPressTransactionSpeed = useCallback(
    onSuccess => {
      gasUtils.showTransactionSpeedOptions(
        gasPrices,
        txFees,
        gasUpdateGasPriceOption,
        onSuccess
      );
    },
    [gasPrices, gasUpdateGasPriceOption, txFees]
  );

  const onLongPressSend = useCallback(() => {
    setIsAuthorizing(true);

    if (isIphoneX()) {
      submitTransaction();
    } else {
      onPressTransactionSpeed(submitTransaction);
    }
  }, [onPressTransactionSpeed, submitTransaction]);

  const onResetAssetSelection = useCallback(() => {
    analytics.track('Reset asset selection in Send flow');
    sendUpdateSelected({});
  }, [sendUpdateSelected]);

  const onChangeInput = useCallback(event => {
    setCurrentInput(event);
    setRecipient(event);
  }, []);

  useEffect(() => {
    gasUpdateDefaultGasLimit();
  }, [gasUpdateDefaultGasLimit]);

  useEffect(() => {
    if (
      (isValidAddress && showAssetList) ||
      (isValidAddress && showAssetForm && selected.type === AssetTypes.nft)
    ) {
      Keyboard.dismiss();
    }
  }, [isValidAddress, selected.type, showAssetForm, showAssetList]);

  const assetOverride = useNavigationParam('asset');
  const prevAssetOverride = usePrevious(assetOverride);

  useEffect(() => {
    if (assetOverride && assetOverride !== prevAssetOverride) {
      sendUpdateSelected(assetOverride);
    }
  }, [assetOverride, prevAssetOverride, sendUpdateSelected]);

  const recipientOverride = useNavigationParam('address');

  useEffect(() => {
    if (recipientOverride && !recipient) {
      sendUpdateRecipient(recipientOverride);
    }
  }, [recipient, recipientOverride, sendUpdateRecipient]);

  const checkAddress = useCallback(async () => {
    const validAddress = await checkIsValidAddress(recipient);
    setIsValidAddress(validAddress);
  }, [recipient]);

  useEffect(() => {
    checkAddress();
  }, [checkAddress]);

  useEffect(() => {
    if (isValidAddress) {
      estimateGasLimit({
        address: accountAddress,
        amount: amountDetails.assetAmount,
        asset: selected,
        recipient,
      })
        .then(gasLimit => {
          gasUpdateTxFee(gasLimit);
        })
        .catch(() => {
          gasUpdateTxFee(null);
        });
    }
  }, [
    accountAddress,
    amountDetails.assetAmount,
    gasUpdateTxFee,
    isValidAddress,
    recipient,
    selected,
  ]);

  return (
    <SheetContainer>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior="padding">
        <Container align="center">
          <SendHeader
            showAssetList={showAssetList}
            setAppearListener={setAppearListener}
            contacts={contacts}
            isValidAddress={isValidAddress}
            onChangeAddressInput={onChangeInput}
            onPressPaste={sendUpdateRecipient}
            recipient={recipient}
            removeContact={removeContact}
          />
          {showEmptyState && (
            <SendContactList
              allAssets={sortedContacts}
              currentInput={currentInput}
              onPressContact={sendUpdateRecipient}
              removeContact={removeContact}
            />
          )}
          {showAssetList && (
            <SendAssetList
              allAssets={allAssets}
              fetchData={fetchData}
              onSelectAsset={sendUpdateSelected}
              savings={savings}
              uniqueTokens={sendableUniqueTokens}
            />
          )}
          {showAssetForm && (
            <SendAssetForm
              {...props}
              allAssets={allAssets}
              assetAmount={amountDetails.assetAmount}
              buttonRenderer={
                <SendButton
                  {...props}
                  assetAmount={amountDetails.assetAmount}
                  isAuthorizing={isAuthorizing}
                  isSufficientBalance={amountDetails.isSufficientBalance}
                  isSufficientGas={isSufficientGas}
                  onLongPress={onLongPressSend}
                />
              }
              nativeAmount={amountDetails.nativeAmount}
              onChangeAssetAmount={onChangeAssetAmount}
              onChangeNativeAmount={onChangeNativeAmount}
              onResetAssetSelection={onResetAssetSelection}
              selected={selected}
              sendMaxBalance={sendMaxBalance}
              txSpeedRenderer={
                isIphoneX() && (
                  <SendTransactionSpeed
                    gasPrice={selectedGasPrice}
                    nativeCurrencySymbol={nativeCurrencySymbol}
                    onPressTransactionSpeed={onPressTransactionSpeed}
                  />
                )
              }
            />
          )}
        </Container>
      </KeyboardAvoidingView>
    </SheetContainer>
  );
};

SendSheet.propTypes = {
  dataAddNewTransaction: PropTypes.func.isRequired,
  gasLimit: PropTypes.number,
  gasPrices: PropTypes.object,
  gasUpdateDefaultGasLimit: PropTypes.func.isRequired,
  gasUpdateGasPriceOption: PropTypes.func.isRequired,
  gasUpdateTxFee: PropTypes.func.isRequired,
  isSufficientGas: PropTypes.bool.isRequired,
  removeContact: PropTypes.func.isRequired,
  setAppearListener: PropTypes.func,
  sortedContacts: PropTypes.array,
  txFees: PropTypes.object.isRequired,
};

const arePropsEqual = (prev, next) =>
  prev.isSufficientGas === next.isSufficientGas &&
  prev.gasLimit === next.gasLimit &&
  prev.txFees === next.txFees &&
  prev.gasPrices === next.gasPrices &&
  prev.allAssets === next.allAssets;
export default React.memo(SendSheet, arePropsEqual);
