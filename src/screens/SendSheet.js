import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { captureEvent, captureException } from '@sentry/react-native';
import { isEmpty, isString, toLower } from 'lodash';
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
  SendButton,
  SendContactList,
  SendHeader,
} from '../components/send';
import { AssetTypes } from '@rainbow-me/entities';
import {
  createSignableTransaction,
  estimateGasLimit,
} from '@rainbow-me/handlers/web3';
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
import { checkIsValidAddressOrDomain } from '@rainbow-me/helpers/validators';
import {
  useAccountAssets,
  useAccountSettings,
  useCoinListEditOptions,
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
import { ETH_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { borders } from '@rainbow-me/styles';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountFromNativeValue,
  formatInputDecimals,
} from '@rainbow-me/utilities';
import { deviceUtils } from '@rainbow-me/utils';
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
  const { isSmallPhone, isTinyPhone } = useDimensions();
  const { navigate, addListener } = useNavigation();
  const { isDarkMode } = useTheme();
  const { dataAddNewTransaction } = useTransactionConfirmation();
  const updateAssetOnchainBalanceIfNeeded = useUpdateAssetOnchainBalance();
  const { allAssets } = useAccountAssets();
  const {
    gasLimit,
    isSufficientGas,
    prevSelectedGasPrice,
    selectedGasPrice,
    startPollingGasPrices,
    stopPollingGasPrices,
    updateDefaultGasLimit,
    updateTxFee,
  } = useGas();
  const isDismissing = useRef(false);

  const recipientFieldRef = useRef();

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
  const { contacts, onRemoveContact, filteredContacts } = useContacts();
  const { userAccounts } = useUserAccounts();
  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const { accountAddress, nativeCurrency, network } = useAccountSettings();

  const savings = useSendSavingsAccount();
  const fetchData = useRefreshAccountData();
  const { hiddenCoins, pinnedCoins } = useCoinListEditOptions();

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
  const { maxInputBalance, updateMaxInputBalance } = useMaxInputBalance();

  const showEmptyState = !isValidAddress;
  const showAssetList = isValidAddress && isEmpty(selected);
  const showAssetForm = isValidAddress && !isEmpty(selected);

  const isNft = selected?.type === AssetTypes.nft;

  const { triggerFocus } = useMagicAutofocus(recipientFieldRef);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => startPollingGasPrices());
    return () => {
      InteractionManager.runAfterInteractions(() => stopPollingGasPrices());
    };
  }, [startPollingGasPrices, stopPollingGasPrices]);

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
      updateMaxInputBalance(newSelected);
      if (newSelected?.type === AssetTypes.nft) {
        setAmountDetails({
          assetAmount: '1',
          isSufficientBalance: true,
          nativeAmount: '0',
        });
        setSelected({
          ...newSelected,
          symbol: newSelected?.asset_contract?.name,
        });
      } else {
        setSelected(newSelected);
        sendUpdateAssetAmount('');
        // Since we don't trust the balance from zerion,
        // let's hit the blockchain and update it
        updateAssetOnchainBalanceIfNeeded(
          newSelected,
          accountAddress,
          updatedAsset => {
            // set selected asset with new balance
            setSelected(updatedAsset);
            // Update selected to recalculate the maxInputAmount
            sendUpdateSelected(updatedAsset);
          }
        );
      }
    },
    [
      accountAddress,
      sendUpdateAssetAmount,
      updateAssetOnchainBalanceIfNeeded,
      updateMaxInputBalance,
    ]
  );

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

  const onSubmit = useCallback(async () => {
    const validTransaction =
      isValidAddress && amountDetails.isSufficientBalance && isSufficientGas;
    if (!selectedGasPrice.txFee || !validTransaction || isAuthorizing) {
      logger.sentry('preventing tx submit for one of the following reasons:');
      logger.sentry('selectedGasPrice.txFee ? ', selectedGasPrice?.txFee);
      logger.sentry('validTransaction ? ', validTransaction);
      logger.sentry('isAuthorizing ? ', isAuthorizing);
      captureEvent('Preventing tx submit');
      return false;
    }

    let submitSuccess = false;
    let updatedGasLimit = null;
    // Attempt to update gas limit before sending ERC20 / ERC721
    if (selected?.address !== ETH_ADDRESS) {
      try {
        // Estimate the tx with gas limit padding before sending
        updatedGasLimit = await estimateGasLimit(
          {
            address: accountAddress,
            amount: amountDetails.assetAmount,
            asset: selected,
            recipient,
          },
          true
        );
        logger.log('gasLimit updated before sending', {
          after: updatedGasLimit,
          before: gasLimit,
        });
        updateTxFee(updatedGasLimit);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    const txDetails = {
      amount: amountDetails.assetAmount,
      asset: selected,
      from: accountAddress,
      gasLimit: updatedGasLimit || gasLimit,
      gasPrice: selectedGasPrice?.value?.amount,
      nonce: null,
      to: recipient,
    };
    try {
      const signableTransaction = await createSignableTransaction(txDetails);
      const txResult = await sendTransaction({
        transaction: signableTransaction,
      });
      const { hash, nonce } = txResult;
      if (!isEmpty(hash)) {
        submitSuccess = true;
        txDetails.hash = hash;
        txDetails.nonce = nonce;
        await dispatch(dataAddNewTransaction(txDetails));
      }
    } catch (error) {
      logger.sentry('TX Details', txDetails);
      logger.sentry('SendSheet onSubmit error');
      captureException(error);
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
    dispatch,
    gasLimit,
    isAuthorizing,
    isSufficientGas,
    isValidAddress,
    recipient,
    selected,
    selectedGasPrice,
    updateTxFee,
  ]);

  const submitTransaction = useCallback(async () => {
    setIsAuthorizing(true);
    if (Number(amountDetails.assetAmount) <= 0) {
      logger.sentry('amountDetails.assetAmount ? ', amountDetails?.assetAmount);
      captureEvent('Preventing tx submit due to amount <= 0');
      return false;
    }

    try {
      const submitSuccessful = await onSubmit();
      analytics.track('Sent transaction', {
        assetName: selected?.name || '',
        assetType: selected?.type || '',
        isRecepientENS: toLower(recipient.slice(-4)) === '.eth',
      });
      if (submitSuccessful) {
        navigate(Routes.WALLET_SCREEN);
        InteractionManager.runAfterInteractions(() => {
          navigate(Routes.PROFILE_SCREEN);
        });
      }
    } catch (error) {
      setIsAuthorizing(false);
    }
  }, [
    amountDetails.assetAmount,
    navigate,
    onSubmit,
    recipient,
    selected?.name,
    selected?.type,
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
      (isValidAddress && showAssetForm && selected?.type === AssetTypes.nft)
    ) {
      Keyboard.dismiss();
    }
  }, [isValidAddress, selected, showAssetForm, showAssetList]);

  const { params } = useRoute();
  const assetOverride = params?.asset;
  const prevAssetOverride = usePrevious(assetOverride);

  useEffect(() => {
    if (assetOverride && assetOverride !== prevAssetOverride) {
      sendUpdateSelected(assetOverride);
    }
  }, [assetOverride, prevAssetOverride, sendUpdateSelected]);

  const recipientOverride = params?.address;

  useEffect(() => {
    if (recipientOverride && !recipient) {
      setRecipient(recipientOverride);
    }
  }, [recipient, recipientOverride]);

  const checkAddress = useCallback(async () => {
    const validAddress = await checkIsValidAddressOrDomain(recipient);
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
        .then(gasLimit => updateTxFee(gasLimit))
        .catch(() => updateTxFee(null));
    }
  }, [
    accountAddress,
    amountDetails.assetAmount,
    dispatch,
    isValidAddress,
    recipient,
    selected,
    updateTxFee,
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
        />
        {showEmptyState && (
          <SendContactList
            contacts={filteredContacts}
            currentInput={currentInput}
            onPressContact={setRecipient}
            removeContact={onRemoveContact}
            userAccounts={userAccounts}
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
              <SendButton
                {...props}
                assetAmount={amountDetails.assetAmount}
                isAuthorizing={isAuthorizing}
                isNft={isNft}
                isSufficientBalance={amountDetails.isSufficientBalance}
                isSufficientGas={isSufficientGas}
                onLongPress={submitTransaction}
                selected={selected}
                smallButton={!isTinyPhone && (android || isSmallPhone)}
                testID="send-sheet-confirm"
                tinyButton={isTinyPhone}
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
                horizontalPadding={isTinyPhone ? 0 : 5}
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
