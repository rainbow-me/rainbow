import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { toChecksumAddress } from 'ethereumjs-util';
import { getAddress, isAddress } from 'viem';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { ShimmerAnimation } from '@/components/animations/ShimmerAnimation';
import { Callout } from '@/components/callout/Callout';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import RequestVendorLogoIcon from '@/components/coin-icon/RequestVendorLogoIcon';
import ContactRowInfoButton from '@/components/ContactRowInfoButton';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import Divider from '@/components/Divider';
import { CheckboxField } from '@/components/fields/CheckboxField';
import L2Disclaimer from '@/components/L2Disclaimer';
import { Centered, Column, Row } from '@/components/layout';
import Pill from '@/components/Pill';
import { SheetHandleFixedToTopHeight, SheetTitle, SlackSheet } from '@/components/sheet';
import { Text as OldText } from '@/components/text';
import TouchableBackdrop from '@/components/TouchableBackdrop';
import { Box, Heading, Inset, Stack, Text, useBackgroundColor, useColorMode } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { AssetType } from '@/entities/assetTypes';
import { getNameService } from '@/features/address/core/address';
import { abbreviateAddress } from '@/features/address/core/formatAddress';
import { PROFILES } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { ENSCircleIcon } from '@/features/ens/components/ENSCircleIcon';
import { ensContracts } from '@/features/ens/core/contracts';
import { isNameToken } from '@/features/ens/data/ownership';
import { useEnsImageStore } from '@/features/ens/data/stores/imageStore';
import { useEnsOwnershipStore, useEnsPermissionsStore } from '@/features/ens/data/stores/ownershipStores';
import { estimateEnsTransactions } from '@/features/ens/data/transactions';
import { useEnsAddressStore } from '@/features/ens/data/useEnsAddressStore';
import type { EnsTransferAction } from '@/features/ens/types/transactions';
import { GasSpeedButton } from '@/features/gas/components/GasSpeedButton';
import useGas from '@/features/gas/hooks/useGas';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import styled from '@/framework/ui/styled-thing';
import svgToPngIfNeeded from '@/handlers/svgs';
import { assetIsParsedAddressAsset, assetIsUniqueAsset, estimateGasLimit, getProvider } from '@/handlers/web3';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { add } from '@/helpers/utilities';
import useColorForAsset from '@/hooks/useColorForAsset';
import useContacts from '@/hooks/useContacts';
import useDimensions from '@/hooks/useDimensions';
import useUserAccounts from '@/hooks/useUserAccounts';
import * as i18n from '@/languages';
import { ensureError, logger, RainbowError } from '@/logger';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { useInteractionsCount } from '@/resources/addys/interactions';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { startTimeToSignTracking } from '@/state/performance/performance';
import { useAccountAddress, useWalletsStore } from '@/state/wallets/walletsStore';
import { position } from '@/styles';
import { useTheme } from '@/theme/ThemeContext';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';

import { SendButton } from '../components/SendButton';

const Container = styled(Centered).attrs({
  direction: 'column',
})(({ deviceHeight, height }: { deviceHeight: number; height: number }) => ({
  ...(height && { height: height + deviceHeight }),
  ...position.coverAsObject,
}));

type Checkbox = {
  id: 'clear-records' | 'set-address' | 'transfer-control' | 'has-wallet-that-supports';
  label: string;
};

const gasOffset = 120;
const checkboxOffset = 44;

export function getSheetHeight({
  shouldShowChecks,
  isL2,
  isENS,
  checkboxCount = 0,
}: {
  shouldShowChecks: boolean;
  isL2: boolean;
  isENS: boolean;
  checkboxCount?: number;
}) {
  let height =
    SheetHandleFixedToTopHeight +
    safeAreaInsetValues.bottom +
    // Title height
    22 +
    // Base content height
    314;
  if (isL2) height = height + 62;
  if (shouldShowChecks) height = height + 80;
  if (isENS) {
    height = height + gasOffset + 20;
    height += checkboxCount * checkboxOffset;
  }
  return height;
}

const ChevronDown = () => {
  const { colors } = useTheme();
  return (
    <Column align="center" height={34.5} position="absolute" width={50}>
      <OldText align="center" color={opacity(colors.blueGreyDark, 0.15)} letterSpacing="zero" size="larger" weight="semibold">
        􀆈
      </OldText>
      <OldText
        align="center"
        color={opacity(colors.blueGreyDark, 0.09)}
        letterSpacing="zero"
        size="larger"
        style={{ top: -13 }}
        weight="semibold"
      >
        􀆈
      </OldText>
    </Column>
  );
};

export const SendConfirmationSheet = () => {
  const theme = useTheme();
  const { isDarkMode } = useColorMode();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const accountAddress = useAccountAddress();
  const { goBack, navigate, setParams } = useNavigation<typeof Routes.SEND_CONFIRMATION_SHEET>();
  const { height: deviceHeight, isSmallPhone, width: deviceWidth } = useDimensions();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const { contacts } = useContacts();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const fillSecondary = useBackgroundColor('fillSecondary');
  const shimmerColor = opacity(fillSecondary, isDarkMode ? 0.025 : 0.06);

  useEffect(() => {
    Platform.OS === 'android' && Keyboard.dismiss();
  }, []);

  const {
    params: { amountDetails, asset, callback, isL2, isSponsored = false, isUniqueAsset, chainId, to, toAddress },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.SEND_CONFIRMATION_SHEET>>();

  const { userAccounts, watchedAccounts } = useUserAccounts();
  const walletNames = useWalletsStore(state => state.walletNames);
  const shouldLoadAvatar = getNameService(to) === 'ens';
  const avatar = useEnsImageStore(s => s.get(shouldLoadAvatar ? { name: to, field: 'avatar' } : undefined));

  const isSendingToUserAccount = useMemo(() => {
    const found = userAccounts?.find(account => {
      return account.address.toLowerCase() === toAddress?.toLowerCase();
    });
    return !!found;
  }, [toAddress, userAccounts]);

  const { data: interactions, isLoading: isLoadingInteractions } = useInteractionsCount(
    { toAddress, chainId },
    {
      enabled: !isSendingToUserAccount,
    }
  );

  const { isSufficientGas, isValidGas, updateTxFee } = useGas({ enableTracking: true });

  const contact = useMemo(() => {
    return contacts?.[toAddress?.toLowerCase()];
  }, [contacts, toAddress]);

  const isENS = asset.type === AssetType.ens && profilesEnabled && assetIsUniqueAsset(asset);
  const ownership = useEnsOwnershipStore(s => (isENS ? s.get(asset.name) : undefined));
  const holder = ownership?.version === 1 ? ownership.registrant : ownership?.owner;
  const matchesToken = isENS && holder?.toLowerCase() === accountAddress.toLowerCase() && isNameToken(ownership, asset);
  const permissions = useEnsPermissionsStore(s => (matchesToken ? s.get({ name: asset.name, account: accountAddress }) : undefined));
  const address = useEnsAddressStore(s =>
    matchesToken && permissions?.canSetAddress ? s.get({ addressOrName: asset.name, chainId }) : undefined
  );

  const [checked, setChecked] = useState<Partial<Record<Checkbox['id'], boolean>>>({});
  const checkboxes: Checkbox[] = [];
  const labels = i18n.l.wallet.transaction.checkboxes;
  if (isENS) {
    if (matchesToken && permissions?.canClearRecords) {
      checkboxes.push({ id: 'clear-records', label: i18n.t(labels.clear_profile_information) });
    }
    if (matchesToken && permissions?.canSetAddress && address?.toLowerCase() !== toAddress.toLowerCase()) {
      const linkedNames = permissions.resolver?.permissioned && !checked['clear-records'];
      checkboxes.push({
        id: 'set-address',
        label: i18n.t(linkedNames ? labels.point_linked_names_to_recipient : labels.point_name_to_recipient),
      });
    }
    if (
      matchesToken &&
      ownership?.version === 1 &&
      ownership.token?.contractAddress === ensContracts.legacyRegistrar &&
      ownership.owner?.toLowerCase() !== toAddress.toLowerCase()
    ) {
      checkboxes.push({ id: 'transfer-control', label: i18n.t(labels.transfer_control) });
    }
  } else if (isL2) {
    checkboxes.push({
      id: 'has-wallet-that-supports',
      label: i18n.t(labels.has_a_wallet_that_supports, {
        networkName: useBackendNetworksStore.getState().getChainsLabel()[chainId],
      }),
    });
  }

  const isChecked = (id: Checkbox['id']) => !!checked[id] && checkboxes.some(option => option.id === id);
  const clearRecords = isChecked('clear-records');
  const setAddress = isChecked('set-address');
  const transferControl = isChecked('transfer-control');
  const action = useMemo((): EnsTransferAction | undefined => {
    if (!isENS || !(clearRecords || setAddress || transferControl)) return undefined;
    return {
      type: 'transfer',
      name: asset.name,
      token: { contractAddress: asset.contractAddress, tokenId: asset.tokenId },
      toAddress,
      clearRecords,
      setAddress,
      transferControl,
    };
  }, [asset, isENS, clearRecords, setAddress, transferControl, toAddress]);
  const [estimatedAction, setEstimatedAction] = useState<EnsTransferAction | null>();

  useEffect(() => {
    if (!isENS) return;
    let active = true;
    setEstimatedAction(undefined);
    Promise.all([
      estimateGasLimit({ address: accountAddress, amount: '0', asset, recipient: toAddress }, true, getProvider({ chainId }), chainId),
      action ? estimateEnsTransactions(action, getAddress(accountAddress)) : '0',
    ])
      .then(([transferGas, preparationGas]) => {
        if (!active || !transferGas) return;
        updateTxFee(add(transferGas, preparationGas), null);
        setEstimatedAction(action ?? null);
      })
      .catch(error => {
        if (!active) return;
        logger.error(new RainbowError('[SendConfirmationSheet] Unable to estimate ENS transfer', error));
        updateTxFee(null, null);
      });
    return () => {
      active = false;
    };
  }, [accountAddress, action, asset, chainId, isENS, toAddress, updateTxFee]);

  const handleENSConfigurationPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'ens_configuration',
    });
  }, [navigate]);

  const handleL2DisclaimerPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'network',
      chainId,
    });
  }, [chainId, navigate]);

  const nativeDisplayAmount = useMemo(
    () => convertAmountToNativeDisplay(amountDetails.nativeAmount, nativeCurrency),
    [amountDetails.nativeAmount, nativeCurrency]
  );

  let color = useColorForAsset(asset);

  if (isUniqueAsset) {
    color = theme.colors.appleBlue;
  }

  const lessThanThreeInteractions = typeof interactions?.specificChainCount === 'undefined' || interactions.specificChainCount < 3;
  const shouldShowChecks = isL2 && !isSendingToUserAccount && lessThanThreeInteractions;

  useEffect(() => {
    setParams({ shouldShowChecks, checkboxCount: checkboxes.length });
  }, [setParams, shouldShowChecks, checkboxes.length]);

  const canSubmit =
    (isSponsored || (isSufficientGas && isValidGas)) &&
    (!isENS || estimatedAction === (action ?? null)) &&
    (!shouldShowChecks || !!checked['has-wallet-that-supports']);

  const insufficientEth = !isSponsored && isSufficientGas === false && isValidGas;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    startTimeToSignTracking();

    try {
      setIsAuthorizing(true);
      await callback(action);
    } catch (e) {
      const error = ensureError(e);
      logger.error(new RainbowError(`[SendConfirmationSheet]: error submitting transaction: ${error.message}`, error));
    } finally {
      setIsAuthorizing(false);
    }
  }, [action, callback, canSubmit]);

  const existingAccount = useMemo(() => {
    let existingAcct = null;
    if (toAddress) {
      const allAccounts = [...userAccounts, ...watchedAccounts].filter(acct => acct.visible);
      for (const account of allAccounts) {
        if (toChecksumAddress(account.address) === toChecksumAddress(toAddress)) {
          existingAcct = account;
          break;
        }
      }
    }
    return existingAcct;
  }, [toAddress, userAccounts, watchedAccounts]);

  let avatarName = removeFirstEmojiFromString(contact?.nickname || existingAccount?.label);

  if (!avatarName) {
    if (!isAddress(to.trim())) {
      avatarName = to;
    } else if (walletNames?.[to]) {
      avatarName = walletNames[to];
    } else {
      avatarName = abbreviateAddress(to, 4, 6) ?? 'default';
    }
  }

  const avatarValue = returnStringFirstEmoji(existingAccount?.label) || addressHashedEmoji(toAddress);

  const avatarColor = existingAccount?.color || contact?.color || addressHashedColorIndex(toAddress);

  const accountImage = profilesEnabled ? avatar || existingAccount?.image : existingAccount?.image;

  const imageUrl = useMemo(() => {
    if (assetIsUniqueAsset(asset)) {
      return svgToPngIfNeeded(asset.images.lowResUrl || asset.images.highResUrl, true);
    }
    return undefined;
  }, [asset]);

  const contentHeight = getSheetHeight({
    checkboxCount: checkboxes.length,
    isENS,
    isL2,
    shouldShowChecks,
  });

  const subHeadingText = useMemo(() => {
    if (assetIsUniqueAsset(asset)) {
      return asset.name;
    } else if (assetIsParsedAddressAsset(asset)) {
      return `${amountDetails.assetAmount} ${asset.symbol}`;
    }
    return '';
  }, [asset, amountDetails]);

  const assetSymbolForDisclaimer = useMemo(() => {
    if (assetIsParsedAddressAsset(asset)) {
      return asset.symbol;
    }
    return undefined;
  }, [asset]);

  const getMessage = () => {
    let message;
    if (isSendingToUserAccount) {
      message = i18n.t(i18n.l.wallet.transaction.you_own_this_wallet);
    } else if (interactions?.totalCount === 0) {
      message = i18n.t(i18n.l.wallet.transaction.first_time_send);
    } else if (interactions?.totalCount) {
      message = i18n.t(i18n.l.wallet.transaction[interactions.totalCount > 1 ? 'previous_sends' : 'previous_send'], {
        number: interactions?.totalCount,
      });
    }
    return message;
  };

  return (
    <Container deviceHeight={deviceHeight} height={contentHeight}>
      {Platform.OS === 'ios' && <TouchableBackdrop onPress={goBack} />}
      <SlackSheet additionalTopPadding={Platform.OS === 'android'} contentHeight={contentHeight} scrollEnabled={false}>
        <SheetTitle>{i18n.t(i18n.l.wallet.transaction.sending_title)}</SheetTitle>
        <Column>
          <Column padding={24}>
            <Row>
              <Column justify="center" width={deviceWidth - 117}>
                <Heading numberOfLines={1} color="primary (Deprecated)" size="26px / 30px (Deprecated)" weight="heavy">
                  {isUniqueAsset ? asset?.name : nativeDisplayAmount}
                </Heading>
                <Row marginTop={12}>
                  <Text
                    color={{
                      custom: isUniqueAsset ? opacity(theme.colors.blueGreyDark, 0.6) : color,
                    }}
                    size="16px / 22px (Deprecated)"
                    weight={isUniqueAsset ? 'bold' : 'heavy'}
                  >
                    {subHeadingText}
                  </Text>
                </Row>
              </Column>
              <Column align="end" flex={1} justify="center">
                <Row>
                  {assetIsUniqueAsset(asset) ? (
                    // @ts-expect-error JavaScript component
                    <RequestVendorLogoIcon
                      backgroundColor={asset.backgroundColor || theme.colors.lightestGrey}
                      borderRadius={10}
                      chainId={asset?.chainId}
                      imageUrl={imageUrl}
                      showLargeShadow
                      size={50}
                    />
                  ) : (
                    <RainbowCoinIcon
                      chainId={asset?.chainId}
                      chainSize={20}
                      color={asset?.colors?.primary || asset?.colors?.fallback || undefined}
                      icon={asset?.icon_url}
                      size={50}
                      symbol={asset?.symbol || ''}
                    />
                  )}
                </Row>
              </Column>
            </Row>

            <Row marginVertical={19}>
              {/* @ts-expect-error – JS component */}
              <Pill borderRadius={15} height={30} minWidth={39} paddingHorizontal={10} paddingVertical={5.5}>
                <OldText
                  align="center"
                  color={theme.colors.blueGreyDark60}
                  letterSpacing="roundedMedium"
                  lineHeight={20}
                  size="large"
                  weight="heavy"
                >
                  {i18n.t(i18n.l.account.tx_to_lowercase)}
                </OldText>
              </Pill>

              <Column align="end" flex={1}>
                <ChevronDown />
              </Column>
            </Row>
            <Row marginBottom={30}>
              <Column flex={1} justify="center">
                <Row width="90%">
                  <Heading numberOfLines={1} color="primary (Deprecated)" size="26px / 30px (Deprecated)" weight="heavy">
                    {avatarName}
                  </Heading>
                  <Centered marginLeft={4}>
                    <ContactRowInfoButton
                      item={{
                        address: toAddress,
                        name: avatarName || abbreviateAddress(to, 4, 8),
                      }}
                      chainId={chainId}
                      scaleTo={0.75}
                    >
                      <Text
                        color={{
                          custom: opacity(theme.colors.blueGreyDark, theme.isDarkMode ? 0.5 : 0.6),
                        }}
                        size="20px / 24px (Deprecated)"
                        weight="heavy"
                      >
                        􀍡
                      </Text>
                    </ContactRowInfoButton>
                  </Centered>
                </Row>
                <Row marginTop={12}>
                  {isLoadingInteractions ? (
                    <Box borderRadius={18} height={{ custom: 18 }} width={{ custom: 140 }} overflow="hidden">
                      <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
                    </Box>
                  ) : (
                    <Box height={{ custom: 18 }}>
                      <Text color={{ custom: opacity(theme.colors.blueGreyDark, 0.6) }} size="16px / 22px (Deprecated)" weight="bold">
                        {getMessage()}
                      </Text>
                    </Box>
                  )}
                </Row>
              </Column>
              <Column align="end" justify="center">
                {accountImage ? (
                  <ImageAvatar image={accountImage} size="lmedium" />
                ) : (
                  <ContactAvatar color={avatarColor} size="lmedium" value={avatarValue} />
                )}
              </Column>
            </Row>
            <Divider color={theme.colors.rowDividerExtraLight} inset={[0]} />
          </Column>
          {(isL2 || isENS || shouldShowChecks) && (
            <Inset bottom="30px (Deprecated)" horizontal="19px (Deprecated)">
              <Stack space="19px (Deprecated)">
                {isL2 && (
                  <Fragment>
                    <L2Disclaimer
                      chainId={asset.chainId}
                      colors={theme.colors}
                      hideDivider
                      marginBottom={0}
                      marginHorizontal={0}
                      onPress={handleL2DisclaimerPress}
                      prominent
                      customText={i18n.t(i18n.l.expanded_state.asset.l2_disclaimer_send, {
                        network: useBackendNetworksStore.getState().getChainsLabel()[asset.chainId],
                      })}
                      symbol={assetSymbolForDisclaimer}
                    />
                  </Fragment>
                )}
                {isENS && checkboxes.length > 0 && (
                  <ButtonPressAnimation onPress={handleENSConfigurationPress} scaleTo={0.95}>
                    <Callout
                      after={
                        <Text color="secondary30 (Deprecated)" size="16px / 22px (Deprecated)" weight="heavy">
                          􀅵
                        </Text>
                      }
                      before={
                        <Box
                          background="accent"
                          borderRadius={20}
                          shadow="12px heavy accent (Deprecated)"
                          style={{ height: 20, width: 20 }}
                        >
                          <ENSCircleIcon height={20} width={20} />
                        </Box>
                      }
                    >
                      {i18n.t(i18n.l.wallet.transaction.ens_configuration_options)}
                    </Callout>
                  </ButtonPressAnimation>
                )}
                {(isENS || shouldShowChecks) && checkboxes.length > 0 && (
                  <Inset horizontal="10px">
                    <Stack space="24px">
                      {checkboxes.map(check => (
                        <CheckboxField
                          color={color}
                          isChecked={!!checked[check.id]}
                          key={check.id}
                          label={check.label}
                          onPress={() => setChecked(previous => ({ ...previous, [check.id]: !previous[check.id] }))}
                          testID={check.id}
                        />
                      ))}
                    </Stack>
                  </Inset>
                )}
              </Stack>
            </Inset>
          )}
          <Column align="center">
            {/* @ts-expect-error JavaScript component */}
            <SendButton
              androidWidth={deviceWidth - 60}
              backgroundColor={color}
              disabled={!canSubmit}
              insufficientEth={insufficientEth}
              isAuthorizing={isAuthorizing}
              onLongPress={handleSubmit}
              requiresChecks={shouldShowChecks}
              smallButton={isSmallPhone}
              testID="send-confirmation-button"
            />
          </Column>
          {isENS && <GasSpeedButton chainId={chainId} theme={theme.isDarkMode ? 'dark' : 'light'} />}
        </Column>
      </SlackSheet>
    </Container>
  );
};
