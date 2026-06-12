import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Keyboard, Platform, StyleSheet, View, type TextInput } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { isEmpty, isEqual, isString } from 'lodash';
import { useDebounce } from 'use-debounce';

import { analytics } from '@/analytics';
import { Column } from '@/components/layout';
import { NoResults } from '@/components/list';
import { NoResultsType } from '@/components/list/NoResults';
import { SheetActionButton } from '@/components/sheet';
import { PROFILES } from '@/config/experimental';
import useExperimentalFlag from '@/config/experimentalHooks';
import { AssetType } from '@/entities/assetTypes';
import { type ParsedAddressAsset } from '@/entities/tokens';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { convertAmountAndPriceToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { SmartWalletActivationCallout } from '@/features/delegation/components/SmartWalletActivationCallout';
import { prefetchENSAvatar } from '@/features/ens/hooks/useENSAvatar';
import { prefetchENSCover } from '@/features/ens/hooks/useENSCover';
import useENSProfile from '@/features/ens/hooks/useENSProfile';
import useENSRegistrationActionHandler from '@/features/ens/hooks/useENSRegistrationActionHandler';
import { debouncedFetchSuggestions } from '@/features/ens/utils/handlers';
import { REGISTRATION_STEPS } from '@/features/ens/utils/helpers';
import GasSpeedButton from '@/features/gas/components/GasSpeedButton';
import useGas from '@/features/gas/hooks/useGas';
import styled from '@/framework/ui/styled-thing';
import {
  assetIsParsedAddressAsset,
  assetIsUniqueAsset,
  buildTransferTransaction,
  estimateGasLimit,
  resolveNameOrAddress,
} from '@/handlers/web3';
import { convertAmountFromNativeValue, formatInputDecimals, greaterThan, greaterThanOrEqualTo } from '@/helpers/utilities';
import { checkIsValidAddressOrDomain, checkIsValidAddressOrDomainFormat, isENSAddressFormat } from '@/helpers/validators';
import useAccountSettings from '@/hooks/useAccountSettings';
import useCoinListEditOptions from '@/hooks/useCoinListEditOptions';
import useColorForAsset from '@/hooks/useColorForAsset';
import useContacts from '@/hooks/useContacts';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import usePrevious from '@/hooks/usePrevious';
import useUserAccounts from '@/hooks/useUserAccounts';
import { logger, RainbowError } from '@/logger';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { type Contact } from '@/redux/contacts';
import { rainbowTokenList } from '@/references/rainbow-token-list';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { getWallets, useAccountAddress, useIsHardwareWallet } from '@/state/wallets/walletsStore';
import { borders } from '@/styles';
import { useTheme, type ThemeContextProps } from '@/theme/ThemeContext';
import deviceUtils from '@/utils/deviceUtils';
import ethereumUtils from '@/utils/ethereumUtils';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';

import SendAssetForm from '../components/SendAssetForm';
import SendAssetList from '../components/SendAssetList';
import SendContactList from '../components/SendContactList';
import SendHeader from '../components/SendHeader';
import useMaxInputBalance from '../hooks/useMaxInputBalance';
import useSendableUniqueTokens from '../hooks/useSendableUniqueTokens';
import { useSendChainState } from '../hooks/useSendChainState';
import useSendSheetInputRefs from '../hooks/useSendSheetInputRefs';
import { useSendSubmit } from '../hooks/useSendSubmit';
import { useSponsoredSendPreparation } from '../hooks/useSponsoredSendPreparation';
import { getSendSubmitButtonState } from '../utils/sendSheetUtils';
import { getDefaultCheckboxes } from './SendConfirmationSheet';

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

const SubmitButtonContainer = styled(View)({
  width: '100%',
});

const styles = StyleSheet.create({
  smartWalletActivationCallout: {
    marginTop: 16,
    width: '100%',
  },
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

const hasSufficientAssetBalance = (assetAmount: string, maxInputBalance: string): boolean =>
  !assetAmount || greaterThanOrEqualTo(maxInputBalance || '0', assetAmount);

export default function SendSheet() {
  const { navigate } = useNavigation();
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
  const theme = useTheme();
  const { colors, isDarkMode } = theme;

  const { nativeCurrencyInputRef, setLastFocusedInputHandle, assetInputRef } = useSendSheetInputRefs();

  const showEmptyState = !isValidAddress;
  const showAssetList = isValidAddress && isEmpty(selected);
  const showAssetForm = isValidAddress && !isEmpty(selected);

  const isUniqueAsset = assetIsUniqueAsset(selected);
  const selectedAddressAsset = selected && assetIsParsedAddressAsset(selected) ? selected : undefined;
  const isENS = selected?.type === AssetType.ens;

  const { currentChainId, currentProvider, isL2 } = useSendChainState({
    accountChainId: chainId,
    selectedAssetChainId: selected?.chainId,
    startPollingGasFees,
    stopPollingGasFees,
  });

  const {
    canUseSponsoredSend,
    hasResolvedSponsoredSend,
    isPreparingSponsoredSend,
    isSponsoredSend,
    isSponsorshipSupported,
    preparedCall: sponsoredSendPreparedCall,
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
    selected: selectedAddressAsset,
    toAddress,
  });
  const { maxInputBalance, updateMaxInputBalance } = useMaxInputBalance({ ignoreGasFee: isSponsorshipSupported });

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

  const sendUpdateAssetAmount = useCallback(
    (newAssetAmount: string) => {
      const _assetAmount = newAssetAmount.replace(/[^0-9.]/g, '');
      let _nativeAmount = '';
      if (_assetAmount.length) {
        const priceUnit = !isUniqueAsset ? (selected?.price?.value ?? 0) : (selected?.floorPrice ?? 0);
        const { amount: convertedNativeAmount } = convertAmountAndPriceToNativeDisplay(_assetAmount, priceUnit, nativeCurrency);
        _nativeAmount = formatInputDecimals(convertedNativeAmount, _assetAmount);
      }

      const _isSufficientBalance = hasSufficientAssetBalance(_assetAmount, maxInputBalance);

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

  // Update all fields passed via params if needed
  useEffect(() => {
    if (!selected || isUniqueAsset) return;

    const newMaxInputBalance = updateMaxInputBalance(selected);
    setAmountDetails(currentAmountDetails => {
      const isSufficientBalance = hasSufficientAssetBalance(currentAmountDetails.assetAmount, newMaxInputBalance);
      if (currentAmountDetails.isSufficientBalance === isSufficientBalance) return currentAmountDetails;

      return {
        ...currentAmountDetails,
        isSufficientBalance,
      };
    });
  }, [isUniqueAsset, isSponsorshipSupported, selected, updateMaxInputBalance]);

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

      const _isSufficientBalance = hasSufficientAssetBalance(_assetAmount, maxInputBalance);
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

      const txData = await buildTransferTransaction(
        {
          address: accountAddress,
          amount: amountDetails.assetAmount,
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

  const { submitTransaction } = useSendSubmit({
    accountAddress,
    amountDetails,
    currentChainId,
    currentProvider,
    ens: { ensName, ensProfile, isENS, transferENS },
    gas: { gasLimit, isSufficientGas, isValidGas, selectedGasFee, updateTxFee, updateTxFeeForOptimism },
    isHardwareWallet,
    isSponsoredSend,
    nativeCurrency,
    recipient: { isValidAddress, recipient, toAddress },
    selected,
    sponsoredSendPreparedCall,
    sponsoredSendPreparedCalls,
  });

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
      !isSponsoredSend &&
      greaterThan(amountDetails.assetAmount, 0) &&
      assetChainId === currentChainId &&
      currentProviderChainId === currentChainId &&
      toAddress &&
      isValidAddress &&
      !isEmpty(selected)
    ) {
      estimateGasLimit(
        {
          address: accountAddress,
          amount: amountDetails.assetAmount,
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
    isSponsoredSend,
    recipient,
    selected,
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
              <SubmitButtonContainer>
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
                {canUseSponsoredSend && (
                  <SmartWalletActivationCallout
                    address={accountAddress}
                    chainId={currentChainId}
                    style={styles.smartWalletActivationCallout}
                  />
                )}
              </SubmitButtonContainer>
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
