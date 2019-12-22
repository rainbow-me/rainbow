import analytics from '@segment/analytics-react-native';
import { get, isEmpty, isString, toLower } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
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
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountFromNativeValue,
  formatInputDecimals,
} from '../helpers/utilities';
import { checkIsValidAddress } from '../helpers/validators';
import usePrevious from '../hooks/usePrevious'; // TODO JIN: update once merged with Mike's code
import { sendTransaction } from '../model/wallet';
import { borders, colors } from '../styles';
import { deviceUtils, ethereumUtils, gasUtils } from '../utils';

const statusBarHeight = getStatusBarHeight(true);

const Container = styled(Column)`
  background-color: ${colors.transparent};
  height: 100%;
`;

const SheetContainer = styled(Column)`
  ${borders.buildRadius('top', 16)};
  background-color: ${colors.white};
  height: 100%;
  top: ${statusBarHeight};
`;

const SendSheet = ({
  accountAddress,
  allAssets,
  contacts,
  dataAddNewTransaction,
  fetchData,
  gasLimit,
  gasPrices,
  gasUpdateDefaultGasLimit,
  gasUpdateGasPriceOption,
  gasUpdateTxFee,
  isSufficientGas,
  nativeCurrency,
  nativeCurrencySymbol,
  removeContact,
  selectedGasPrice,
  sendableUniqueTokens,
  sortedContacts,
  txFees,
  ...props
}) => {
  const { navigate, setParams } = useNavigation();
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

  const showEmptyState = !isValidAddress;
  const showAssetList = isValidAddress && isEmpty(selected);
  const showAssetForm = isValidAddress && !isEmpty(selected);

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
      const balanceAmount = ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        selected
      );
      const _isSufficientBalance =
        Number(_assetAmount) <= Number(balanceAmount);
      setAmountDetails({
        assetAmount: _assetAmount,
        isSufficientBalance: _isSufficientBalance,
        nativeAmount: _nativeAmount,
      });
    },
    [nativeCurrency, selected, selectedGasPrice]
  );

  const sendUpdateSelected = useCallback(
    newSelected => {
      if (get(newSelected, 'isNft')) {
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
        sendUpdateAssetAmount(amountDetails.assetAmount);
      }
    },
    [amountDetails.assetAmount, sendUpdateAssetAmount]
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

      const balanceAmount = ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        selected
      );
      const _isSufficientBalance =
        Number(_assetAmount) <= Number(balanceAmount);

      setAmountDetails({
        assetAmount: _assetAmount,
        isSufficientBalance: _isSufficientBalance,
        nativeAmount: _nativeAmount,
      });
      analytics.track('Changed native currency input in Send flow');
    },
    [selected, selectedGasPrice]
  );

  const sendMaxBalance = useCallback(() => {
    const balanceAmount = ethereumUtils.getBalanceAmount(
      selectedGasPrice,
      selected
    );
    sendUpdateAssetAmount(balanceAmount);
  }, [selected, selectedGasPrice, sendUpdateAssetAmount]);

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
        assetType: selected.isNft ? 'unique_token' : 'token',
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
    selected.isNft,
    selected.name,
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
    if (isValidAddress) {
      Keyboard.dismiss();
    }
  }, [isValidAddress]);

  const verticalGestureResponseDistance = useMemo(() => {
    let verticalGestureResponseDistance = 140;

    if (!isValidAddress && !isEmpty(contacts)) {
      verticalGestureResponseDistance = 140;
    } else if (isValidAddress) {
      verticalGestureResponseDistance = isEmpty(selected)
        ? 140
        : deviceUtils.dimensions.height;
    } else {
      verticalGestureResponseDistance = deviceUtils.dimensions.height;
    }
    return verticalGestureResponseDistance;
  }, [contacts, isValidAddress, selected]);

  const prevResponseDistance = usePrevious(verticalGestureResponseDistance);

  useEffect(() => {
    if (prevResponseDistance !== verticalGestureResponseDistance) {
      setParams({ verticalGestureResponseDistance });
    }
  }, [prevResponseDistance, setParams, verticalGestureResponseDistance]);

  const assetOverride = useNavigationParam('asset');

  useEffect(() => {
    if (isValidAddress && assetOverride) {
      sendUpdateSelected(assetOverride);
    }
  }, [assetOverride, isValidAddress, sendUpdateSelected]);

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
      <KeyboardAvoidingView behavior="padding">
        <Container align="center">
          <SendHeader
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
  accountAddress: PropTypes.string.isRequired,
  allAssets: PropTypes.array,
  dataAddNewTransaction: PropTypes.func.isRequired,
  fetchData: PropTypes.func.isRequired,
  gasLimit: PropTypes.number,
  gasPrices: PropTypes.object,
  gasUpdateDefaultGasLimit: PropTypes.func.isRequired,
  gasUpdateGasPriceOption: PropTypes.func.isRequired,
  gasUpdateTxFee: PropTypes.func.isRequired,
  isSufficientGas: PropTypes.bool.isRequired,
  nativeCurrency: PropTypes.string.isRequired,
  nativeCurrencySymbol: PropTypes.string.isRequired,
  removeContact: PropTypes.func.isRequired,
  selectedGasPrice: PropTypes.object,
  sendableUniqueTokens: PropTypes.arrayOf(PropTypes.object),
  sortedContacts: PropTypes.array,
  txFees: PropTypes.object.isRequired,
};

const arePropsEqual = (prev, next) =>
  prev.isSufficientGas === next.isSufficientGas &&
  prev.gasLimit === next.gasLimit &&
  prev.selectedGasPrice === next.selectedGasPrice &&
  prev.txFees === next.txFees &&
  prev.gasPrices === next.gasPrices &&
  prev.allAssets === next.allAssets;
export default React.memo(SendSheet, arePropsEqual);
