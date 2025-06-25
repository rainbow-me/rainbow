import { opacity } from '@/__swaps__/utils/swaps';
import Divider from '@/components/Divider';
import { ShimmerAnimation } from '@/components/animations';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { Box, Heading, Inset, Stack, Text, useBackgroundColor, useColorMode } from '@/design-system';
import { AssetType } from '@/entities';
import { IS_ANDROID, IS_IOS } from '@/env';
import {
  estimateENSReclaimGasLimit,
  estimateENSSetAddressGasLimit,
  estimateENSSetRecordsGasLimit,
  formatRecordsForTransaction,
} from '@/handlers/ens';
import svgToPngIfNeeded from '@/handlers/svgs';
import { assetIsParsedAddressAsset, assetIsUniqueAsset, estimateGasLimit, getProvider } from '@/handlers/web3';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { add, convertAmountToNativeDisplay } from '@/helpers/utilities';
import { isENSAddressFormat, isValidDomainFormat } from '@/helpers/validators';
import { useColorForAsset, useContacts, useDimensions, useENSAvatar, useGas, useUserAccounts } from '@/hooks';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { useInteractionsCount } from '@/resources/addys/interactions';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { performanceTracking, Screens, TimeToSignOperation } from '@/state/performance/performance';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { useTheme } from '@/theme';
import { promiseUtils } from '@/utils';
import { AddressZero } from '@ethersproject/constants';
import { RouteProp, useRoute } from '@react-navigation/native';
import { toChecksumAddress } from 'ethereumjs-util';
import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContactRowInfoButton from '../components/ContactRowInfoButton';
import L2Disclaimer from '../components/L2Disclaimer';
import Pill from '../components/Pill';
import TouchableBackdrop from '../components/TouchableBackdrop';
import ButtonPressAnimation from '../components/animations/ButtonPressAnimation';
import Callout from '../components/callout/Callout';
import RequestVendorLogoIcon from '../components/coin-icon/RequestVendorLogoIcon';
import { ContactAvatar } from '../components/contacts';
import ImageAvatar from '../components/contacts/ImageAvatar';
import CheckboxField from '../components/fields/CheckboxField';
import { GasSpeedButton } from '../components/gas';
import ENSCircleIcon from '../components/icons/svg/ENSCircleIcon';
import { Centered, Column, Row } from '../components/layout';
import { SendButton } from '../components/send';
import { SheetTitle, SlackSheet } from '../components/sheet';
import { Text as OldText } from '../components/text';
import { ENSProfile } from '../entities/ens';
import { useAccountAddress, useWalletsStore } from '@/state/wallets/walletsStore';
import { address } from '../utils/abbreviations';
import { addressHashedColorIndex, addressHashedEmoji } from '../utils/profileUtils';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const Container = styled(Centered).attrs({
  direction: 'column',
})(({ deviceHeight, height }: { deviceHeight: number; height: number }) => ({
  ...(height && { height: height + deviceHeight }),
  ...position.coverAsObject,
}));

const SendButtonWrapper = styled(Column).attrs({
  align: 'center',
})({
  height: 56,
});

export type Checkbox = {
  checked: boolean;
  id: 'clear-records' | 'set-address' | 'transfer-control' | 'has-wallet-that-supports';
  label: string;
};

const hasClearProfileInfo = (ensProfile?: ENSProfile) =>
  isEmpty({
    ...ensProfile?.data?.records,
    ...ensProfile?.data?.coinAddresses,
  }) && !ensProfile?.data?.contenthash;
const doesNamePointToRecipient = (ensProfile?: ENSProfile, recipientAddress?: string) =>
  ensProfile?.data?.address?.toLowerCase() === recipientAddress?.toLowerCase();
const isRegistrant = (ensProfile?: ENSProfile) => ensProfile?.isRegistrant;

const gasOffset = 120;
const checkboxOffset = 44;

export function getDefaultCheckboxes({
  isENS,
  ensProfile,
  chainId,
  toAddress,
}: {
  isENS: boolean;
  ensProfile: ENSProfile;
  chainId: ChainId;
  toAddress: string;
}): Checkbox[] {
  if (isENS) {
    return [
      !hasClearProfileInfo(ensProfile) &&
        ensProfile?.isOwner && {
          checked: false,
          id: 'clear-records',
          label: lang.t('wallet.transaction.checkboxes.clear_profile_information'),
        },
      !doesNamePointToRecipient(ensProfile, toAddress) &&
        ensProfile?.isOwner && {
          checked: false,
          id: 'set-address',
          label: lang.t('wallet.transaction.checkboxes.point_name_to_recipient'),
        },
      isRegistrant(ensProfile) &&
        ensProfile?.data?.owner?.address?.toLowerCase() !== toAddress.toLowerCase() && {
          checked: false,
          id: 'transfer-control',
          label: lang.t('wallet.transaction.checkboxes.transfer_control'),
        },
    ].filter(Boolean) as Checkbox[];
  }
  return [
    {
      checked: false,
      id: 'has-wallet-that-supports',
      label: lang.t('wallet.transaction.checkboxes.has_a_wallet_that_supports', {
        networkName: useBackendNetworksStore.getState().getChainsLabel()[chainId],
      }),
    },
  ];
}

export function getSheetHeight({
  shouldShowChecks,
  isL2,
  isENS,
  checkboxes,
}: {
  shouldShowChecks: boolean;
  isL2: boolean;
  isENS: boolean;
  checkboxes: Checkbox[];
}) {
  let height = android ? 400 : 377;
  if (isL2) height = height + 35;
  if (shouldShowChecks) height = height + 80;
  if (isENS) {
    height = height + gasOffset + 20;
    height = height + checkboxes?.length * checkboxOffset || 0;
  }
  return height;
}

const ChevronDown = () => {
  const { colors } = useTheme();
  return (
    <Column align="center" height={ios ? 34.5 : 30} marginTop={android ? -14 : 0} position="absolute" width={50}>
      <OldText align="center" color={colors.alpha(colors.blueGreyDark, 0.15)} letterSpacing="zero" size="larger" weight="semibold">
        􀆈
      </OldText>
      <OldText
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.09)}
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
  const { goBack, navigate, setParams } = useNavigation<typeof Routes.SEND_SHEET>();
  const { height: deviceHeight, isSmallPhone, isTinyPhone, width: deviceWidth } = useDimensions();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const insets = useSafeAreaInsets();
  const { contacts } = useContacts();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const fillSecondary = useBackgroundColor('fillSecondary');
  const shimmerColor = opacity(fillSecondary, isDarkMode ? 0.025 : 0.06);

  useEffect(() => {
    IS_ANDROID && Keyboard.dismiss();
  }, []);

  const {
    params: { amountDetails, asset, callback, ensProfile, isL2, isNft, chainId, to, toAddress },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.SEND_CONFIRMATION_SHEET>>();

  const { userAccounts, watchedAccounts } = useUserAccounts();
  const walletNames = useWalletsStore(state => state.walletNames);
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

  const isENS = asset.type === AssetType.ens && profilesEnabled;

  const [checkboxes, setCheckboxes] = useState<Checkbox[]>(getDefaultCheckboxes({ ensProfile, isENS, chainId, toAddress }));

  useEffect(() => {
    const provider = getProvider({ chainId });
    if (isENS) {
      const promises = [
        estimateGasLimit(
          {
            address: accountAddress,
            amount: 0,
            asset,
            recipient: toAddress,
          },
          true,
          provider
        ),
      ];
      const sendENSOptions = Object.fromEntries(checkboxes.map(option => [option.id, option.checked])) as {
        [key in Checkbox['id']]: Checkbox['checked'];
      };
      const cleanENSName = asset?.name?.split(' ')?.[0] ?? asset?.name;

      if (sendENSOptions['clear-records']) {
        let records = Object.keys({
          ...(ensProfile?.data?.contenthash ? { contenthash: ensProfile?.data?.contenthash } : {}),
          ...(ensProfile?.data?.coinAddresses ?? {}),
          ...(ensProfile?.data?.records ?? {}),
        }).reduce((records, recordKey) => {
          return {
            ...records,
            [recordKey]: '',
          };
        }, {});
        if (sendENSOptions['set-address']) {
          records = { ...records, ETH: toAddress };
        } else {
          records = { ...records, ETH: AddressZero };
        }
        promises.push(
          estimateENSSetRecordsGasLimit({
            name: cleanENSName,
            ownerAddress: accountAddress,
            records,
          })
        );
      } else if (sendENSOptions['set-address']) {
        promises.push(
          estimateENSSetAddressGasLimit({
            name: cleanENSName,
            ownerAddress: accountAddress,
            records: formatRecordsForTransaction({ ETH: toAddress }),
          })
        );
      }
      if (sendENSOptions['transfer-control']) {
        promises.push(
          estimateENSReclaimGasLimit({
            name: cleanENSName,
            ownerAddress: accountAddress,
            toAddress,
          })
        );
      }
      promiseUtils
        .PromiseAllWithFails(promises)
        .then(gasLimits => {
          const gasLimit = gasLimits.reduce(add, 0);
          updateTxFee(gasLimit, null);
        })
        .catch(e => {
          logger.error(new RainbowError(`[SendConfirmationSheet]: error calculating gas limit: ${e}`));
          updateTxFee(null, null);
        });
    }
  }, [
    accountAddress,
    asset,
    chainId,
    checkboxes,
    ensProfile?.data?.coinAddresses,
    ensProfile?.data?.contenthash,
    ensProfile?.data?.records,
    isENS,
    toAddress,
    updateTxFee,
  ]);

  const handleCheckbox = useCallback(
    (checkbox: Checkbox & { index: number }) => {
      const newCheckboxesState = [...checkboxes];
      newCheckboxesState[checkbox.index] = checkbox;
      setCheckboxes(newCheckboxesState);
    },
    [checkboxes]
  );

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

  if (isNft) {
    color = theme.colors.appleBlue;
  }

  const lessThanThreeInteractions = typeof interactions?.specificChainCount === 'undefined' || interactions.specificChainCount < 3;
  const shouldShowChecks = isL2 && !isSendingToUserAccount && lessThanThreeInteractions;

  useEffect(() => {
    setParams({ shouldShowChecks });
  }, [setParams, shouldShowChecks]);

  const canSubmit =
    isSufficientGas && isValidGas && (!shouldShowChecks || checkboxes.filter(check => check.checked === false).length === 0);

  const insufficientEth = isSufficientGas === false && isValidGas;

  const handleSubmit = useCallback(
    () =>
      performanceTracking.getState().executeFn({
        fn: async () => {
          if (!canSubmit) return;
          try {
            setIsAuthorizing(true);
            if (isENS) {
              const clearRecords = checkboxes.some(({ checked, id }) => checked && id === 'clear-records');
              const setAddress = checkboxes.some(({ checked, id }) => checked && id === 'set-address');
              const transferControl = checkboxes.some(({ checked, id }) => checked && id === 'transfer-control');
              await callback({
                ens: { clearRecords, setAddress, transferControl },
              });
            } else {
              await callback();
            }
          } catch (e) {
            logger.error(new RainbowError(`[SendConfirmationSheet]: error submitting transaction: ${e}`));
            setIsAuthorizing(false);
          }
        },
        operation: TimeToSignOperation.CallToAction,
        screen: isENS ? Screens.SEND_ENS : Screens.SEND,
      })(),
    [callback, canSubmit, checkboxes, isENS]
  );

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
    if (isValidDomainFormat(to)) {
      avatarName = to;
    } else if (walletNames?.[to]) {
      avatarName = walletNames[to];
    } else {
      avatarName = address(to, 4, 6) ?? 'default';
    }
  }

  const avatarValue = returnStringFirstEmoji(existingAccount?.label) || addressHashedEmoji(toAddress);

  const avatarColor = existingAccount?.color || contact?.color || addressHashedColorIndex(toAddress);

  const { data: avatar } = useENSAvatar(to, {
    enabled: isENSAddressFormat(to),
  });

  const accountImage = profilesEnabled ? avatar?.imageUrl || existingAccount?.image : existingAccount?.image;

  const imageUrl = useMemo(() => {
    if (assetIsUniqueAsset(asset)) {
      return svgToPngIfNeeded(asset.images.lowResUrl || asset.images.highResUrl, true);
    }
    return undefined;
  }, [asset]);

  const contentHeight = getSheetHeight({
    checkboxes,
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
    <Container deviceHeight={deviceHeight} height={contentHeight} insets={insets}>
      {IS_IOS && <TouchableBackdrop onPress={goBack} />}

      <SlackSheet additionalTopPadding={IS_ANDROID} contentHeight={contentHeight} scrollEnabled={false}>
        <SheetTitle>{lang.t('wallet.transaction.sending_title')}</SheetTitle>
        <Column height={contentHeight}>
          <Column padding={24}>
            <Row>
              <Column justify="center" width={deviceWidth - 117}>
                <Heading numberOfLines={1} color="primary (Deprecated)" size="26px / 30px (Deprecated)" weight="heavy">
                  {isNft ? asset?.name : nativeDisplayAmount}
                </Heading>
                <Row marginTop={12}>
                  <Text
                    color={{
                      custom: isNft ? theme.colors.alpha(theme.colors.blueGreyDark, 0.6) : color,
                    }}
                    size="16px / 22px (Deprecated)"
                    weight={isNft ? 'bold' : 'heavy'}
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
                  {lang.t('account.tx_to_lowercase')}
                </OldText>
              </Pill>

              <Column align="end" flex={1}>
                <ChevronDown />
              </Column>
            </Row>
            <Row marginBottom={android ? 15 : 30}>
              <Column flex={1} justify="center">
                <Row width={android ? '80%' : '90%'}>
                  <Heading numberOfLines={1} color="primary (Deprecated)" size="26px / 30px (Deprecated)" weight="heavy">
                    {avatarName}
                  </Heading>
                  <Centered marginLeft={4}>
                    <ContactRowInfoButton
                      item={{
                        address: toAddress,
                        name: avatarName || address(to, 4, 8),
                      }}
                      chainId={chainId}
                      scaleTo={0.75}
                    >
                      <Text
                        color={{
                          custom: theme.colors.alpha(theme.colors.blueGreyDark, theme.isDarkMode ? 0.5 : 0.6),
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
                      <Text
                        color={{ custom: theme.colors.alpha(theme.colors.blueGreyDark, 0.6) }}
                        size="16px / 22px (Deprecated)"
                        weight="bold"
                      >
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
                  <ButtonPressAnimation onPress={handleENSConfigurationPress} scale={0.95}>
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
                      {lang.t('wallet.transaction.ens_configuration_options')}
                    </Callout>
                  </ButtonPressAnimation>
                )}
                {(isENS || shouldShowChecks) && checkboxes.length > 0 && (
                  <Inset horizontal="10px">
                    <Stack space="24px">
                      {checkboxes.map((check, i) => (
                        <CheckboxField
                          color={color}
                          isChecked={check.checked}
                          key={`check_${i}`}
                          label={check.label}
                          onPress={() =>
                            handleCheckbox({
                              ...check,
                              checked: !check.checked,
                              index: i,
                            })
                          }
                          testID={check.id}
                        />
                      ))}
                    </Stack>
                  </Inset>
                )}
              </Stack>
            </Inset>
          )}
          <SendButtonWrapper>
            {/* @ts-expect-error JavaScript component */}
            <SendButton
              androidWidth={deviceWidth - 60}
              backgroundColor={color}
              disabled={!canSubmit}
              insufficientEth={insufficientEth}
              isAuthorizing={isAuthorizing}
              onLongPress={handleSubmit}
              requiresChecks={shouldShowChecks}
              smallButton={!isTinyPhone && (android || isSmallPhone)}
              testID="send-confirmation-button"
            />
          </SendButtonWrapper>
          {isENS && <GasSpeedButton chainId={chainId} theme={theme.isDarkMode ? 'dark' : 'light'} />}
        </Column>
      </SlackSheet>
    </Container>
  );
};
