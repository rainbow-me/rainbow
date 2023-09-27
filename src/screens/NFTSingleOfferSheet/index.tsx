import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { useRoute } from '@react-navigation/native';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  Inline,
  Inset,
  Separator,
  Text,
  Columns,
  Column,
  useForegroundColor,
} from '@/design-system';
import { ImgixImage } from '@/components/images';
import {
  getFormattedTimeQuantity,
  convertAmountToNativeDisplay,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import * as i18n from '@/languages';
import { NftOffer } from '@/graphql/__generated__/arc';
import { CoinIcon } from '@/components/coin-icon';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import { IS_ANDROID } from '@/env';
import ConditionalWrap from 'conditional-wrap';
import Routes from '@/navigation/routesNames';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings, useGas, useWallets } from '@/hooks';
import { TransactionStatus, TransactionType } from '@/entities';
import { analyticsV2 } from '@/analytics';
import { BigNumber } from '@ethersproject/bignumber';
import { HoldToAuthorizeButton } from '@/components/buttons';
import { GasSpeedButton } from '@/components/gas';
import { loadPrivateKey } from '@/model/wallet';
import { Execute, getClient } from '@reservoir0x/reservoir-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { useDispatch } from 'react-redux';
import { dataAddNewTransaction } from '@/redux/data';
import { RainbowError, logger } from '@/logger';
import { estimateNFTOfferGas } from '@/handlers/nftOffers';
import { useTheme } from '@/theme';
import { Network } from '@/helpers';
import { getNetworkObj } from '@/networks';
import { CardSize } from '@/components/unique-token/CardSize';
import { queryClient } from '@/react-query';
import { nftOffersQueryKey } from '@/resources/nftOffers';

const NFT_IMAGE_HEIGHT = 160;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const RAINBOW_FEE_BIPS = 85;
const BIPS_TO_DECIMAL_RATIO = 10000;

const RAINBOW_FEE_ADDRESS_MAINNET =
  '0x69d6d375de8c7ade7e44446df97f49e661fdad7d';
const RAINBOW_FEE_ADDRESS_POLYGON =
  '0xfb9af3db5e19c4165f413f53fe3bbe6226834548';
const RAINBOW_FEE_ADDRESS_OPTIMISM =
  '0x0d9b71891dc86400acc7ead08c80af301ccb3d71';
const RAINBOW_FEE_ADDRESS_ARBITRUM =
  '0x0f9259af03052c96afda88add62eb3b5cbc185f1';
const RAINBOW_FEE_ADDRESS_BASE = '0x1bbe055ad3204fa4468b4e6d3a3c59b9d9ac8c19';
const RAINBOW_FEE_ADDRESS_BSC = '0x9670271ec2e2937a2e9df536784344bbff2bbea6';
const RAINBOW_FEE_ADDRESS_ZORA = '0x7a3d05c70581bd345fe117c06e45f9669205384f';

function getRainbowFeeAddress(network: Network) {
  switch (network) {
    case Network.mainnet:
      return RAINBOW_FEE_ADDRESS_MAINNET;
    case Network.polygon:
      return RAINBOW_FEE_ADDRESS_POLYGON;
    case Network.optimism:
      return RAINBOW_FEE_ADDRESS_OPTIMISM;
    case Network.arbitrum:
      return RAINBOW_FEE_ADDRESS_ARBITRUM;
    case Network.base:
      return RAINBOW_FEE_ADDRESS_BASE;
    case Network.bsc:
      return RAINBOW_FEE_ADDRESS_BSC;
    case Network.zora:
      return RAINBOW_FEE_ADDRESS_ZORA;
    default:
      return undefined;
  }
}

function Row({
  symbol,
  label,
  value,
}: {
  symbol: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box height="36px" alignItems="center">
      <Columns>
        <Column>
          <Inline space="4px" alignVertical="center">
            <Box width={{ custom: 28 }}>
              <Text color="labelTertiary" size="15pt" weight="medium">
                {symbol}
              </Text>
            </Box>

            <Text color="labelTertiary" size="17pt" weight="medium">
              {label}
            </Text>
          </Inline>
        </Column>
        <Column>{value}</Column>
      </Columns>
    </Box>
  );
}

export function NFTSingleOfferSheet() {
  const { params } = useRoute();
  const { navigate, setParams } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { isReadOnlyWallet } = useWallets();
  const { isDarkMode } = useTheme();
  const {
    updateTxFee,
    startPollingGasFees,
    stopPollingGasFees,
    isSufficientGas,
    isValidGas,
  } = useGas();
  const dispatch = useDispatch();
  const {
    data: { nftsMap },
  } = useLegacyNFTs({ address: accountAddress });

  const { offer } = params as { offer: NftOffer };

  const [height, setHeight] = useState(0);
  const didErrorRef = useRef<boolean>(false);
  const didCompleteRef = useRef<boolean>(false);
  const txsRef = useRef<string[]>([]);

  const nft = nftsMap[offer.nft.uniqueId];

  const insufficientEth = isSufficientGas === false && isValidGas;

  const network = offer.network as Network;
  const rainbowFeeAddress = getRainbowFeeAddress(network);
  const rainbowFeeDecimal =
    (offer.grossAmount.decimal * RAINBOW_FEE_BIPS) / BIPS_TO_DECIMAL_RATIO;
  const feeParam = rainbowFeeAddress
    ? `${rainbowFeeAddress}:${BigNumber.from(offer.grossAmount.raw)
        .mul(RAINBOW_FEE_BIPS)
        .div(BIPS_TO_DECIMAL_RATIO)
        .toString()}`
    : undefined;

  const [timeRemaining, setTimeRemaining] = useState(
    offer.validUntil
      ? Math.max(offer.validUntil * 1000 - Date.now(), 0)
      : undefined
  );
  const isExpiring =
    timeRemaining !== undefined && timeRemaining <= TWO_HOURS_MS;
  const isExpired = timeRemaining === 0;
  const time = timeRemaining
    ? getFormattedTimeQuantity(timeRemaining)
    : undefined;

  const isFloorDiffPercentagePositive = offer.floorDifferencePercentage >= 0;
  const listPrice = handleSignificantDecimals(
    offer.grossAmount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.grossAmount.decimal >= 10_000
  );
  const floorPrice = handleSignificantDecimals(
    offer.floorPrice.amount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.floorPrice.amount.decimal >= 10_000
  );
  const netCurrency = convertAmountToNativeDisplay(
    offer.netAmount.usd,
    'USD',
    undefined,
    // don't show decimals
    false,
    // abbreviate if amount is >= 10,000
    offer.netAmount.decimal >= 10_000
  );
  const netCrypto = handleSignificantDecimals(
    offer.netAmount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.netAmount.decimal >= 10_000
  );

  const buttonColorFallback = useForegroundColor('accent');

  const feesPercentage = Math.floor(offer.feesPercentage * 10) / 10;
  const royaltiesPercentage = Math.floor(offer.royaltiesPercentage * 10) / 10;

  useEffect(() => {
    setParams({ longFormHeight: height });
  }, [height, setParams]);

  useEffect(() => {
    if (offer.validUntil) {
      const interval = setInterval(() => {
        setTimeRemaining(Math.max(offer.validUntil * 1000 - Date.now(), 0));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [offer.validUntil]);

  const estimateGas = useCallback(() => {
    const networkObj = getNetworkObj(network);
    const signer = createWalletClient({
      // @ts-ignore
      account: accountAddress,
      chain: networkObj,
      transport: http(networkObj.rpc),
    });
    getClient()?.actions.acceptOffer({
      items: [
        {
          token: `${offer.nft.contractAddress}:${offer.nft.tokenId}`,
          quantity: 1,
        },
      ],
      options: feeParam
        ? {
            feesOnTop: [feeParam],
          }
        : undefined,
      chainId: networkObj.id,
      precheck: true,
      wallet: signer,
      onProgress: async (steps: Execute['steps']) => {
        let sale;
        let approval;
        steps.forEach(step =>
          step.items?.forEach(async item => {
            if (item.data?.data && item.data?.to && item.data?.from) {
              if (step.id === 'sale') {
                sale = {
                  to: item.data.to,
                  from: item.data.from,
                  data: item.data.data,
                };
              } else if (step.id === 'nft-approval') {
                approval = {
                  to: item.data.to,
                  from: item.data.from,
                  data: item.data.data,
                };
              }
            }
          })
        );
        const gas = await estimateNFTOfferGas(offer, approval, sale);
        if (gas) {
          updateTxFee(gas, null);
          startPollingGasFees(network);
        }
      },
    });
  }, [
    accountAddress,
    feeParam,
    network,
    offer,
    startPollingGasFees,
    updateTxFee,
  ]);

  // estimate gas
  useEffect(() => {
    if (!isReadOnlyWallet && !isExpired) {
      estimateGas();
    }
    return () => {
      stopPollingGasFees();
    };
  }, [estimateGas, isExpired, isReadOnlyWallet, stopPollingGasFees]);

  const acceptOffer = useCallback(async () => {
    logger.info(
      `Initiating sale of NFT ${offer.nft.contractAddress}:${offer.nft.tokenId}`
    );
    const analyticsEventObject = {
      nft: {
        contractAddress: offer.nft.contractAddress,
        tokenId: offer.nft.tokenId,
        network: offer.network,
      },
      marketplace: offer.marketplace.name,
      offerValue: offer.grossAmount.decimal,
      offerValueUSD: offer.grossAmount.usd,
      floorDifferencePercentage: offer.floorDifferencePercentage,
      rainbowFee: rainbowFeeDecimal,
      offerCurrency: {
        symbol: offer.paymentToken.symbol,
        contractAddress: offer.paymentToken.address,
      },
    };
    analyticsV2.track(analyticsV2.event.nftOffersAcceptedOffer, {
      status: 'in progress',
      ...analyticsEventObject,
    });
    const privateKey = await loadPrivateKey(accountAddress, false);
    // @ts-ignore
    const account = privateKeyToAccount(privateKey);
    const networkObj = getNetworkObj(network);
    const signer = createWalletClient({
      account,
      chain: networkObj,
      transport: http(networkObj.rpc),
    });
    getClient()?.actions.acceptOffer({
      items: [
        {
          token: `${offer.nft.contractAddress}:${offer.nft.tokenId}`,
          quantity: 1,
        },
      ],
      options: feeParam
        ? {
            feesOnTop: [feeParam],
          }
        : undefined,
      chainId: networkObj.id,
      wallet: signer!,
      onProgress: (steps: Execute['steps']) => {
        steps.forEach(step => {
          if (step.error && !didErrorRef.current) {
            didErrorRef.current = true;
            logger.error(
              new RainbowError(
                `Error selling NFT ${offer.nft.contractAddress} #${offer.nft.tokenId} on marketplace ${offer.marketplace.name}: ${step.error}`
              )
            );
            analyticsV2.track(analyticsV2.event.nftOffersAcceptedOffer, {
              status: 'failed',
              ...analyticsEventObject,
            });
            Alert.alert(
              i18n.t(i18n.l.nft_offers.single_offer_sheet.error.title),
              i18n.t(i18n.l.nft_offers.single_offer_sheet.error.message),
              [
                {
                  onPress: () =>
                    navigate(Routes.NFT_SINGLE_OFFER_SHEET, { offer }),
                  text: i18n.t(i18n.l.button.go_back),
                },
                {
                  text: i18n.t(i18n.l.button.cancel),
                },
              ]
            );
            return;
          }
          step.items?.forEach(item => {
            if (
              item.txHash &&
              !txsRef.current.includes(item.txHash) &&
              item.status === 'incomplete'
            ) {
              let tx;
              if (step.id === 'sale') {
                tx = {
                  to: item.data?.to,
                  from: item.data?.from,
                  hash: item.txHash,
                  network: offer.network,
                  amount: offer.netAmount.decimal,
                  asset: {
                    address: offer.paymentToken.address,
                    symbol: offer.paymentToken.symbol,
                  },
                  nft,
                  type: TransactionType.sell,
                  status: TransactionStatus.selling,
                };
              } else if (step.id === 'nft-approval') {
                tx = {
                  to: item.data?.to,
                  from: item.data?.from,
                  hash: item.txHash,
                  network: offer.network,
                  nft,
                  type: TransactionType.authorize,
                  status: TransactionStatus.approving,
                };
              }
              if (tx) {
                txsRef.current.push(tx.hash);
                // @ts-ignore TODO: fix when we overhaul tx list, types are not good
                dispatch(dataAddNewTransaction(tx));
              }
            } else if (
              item.status === 'complete' &&
              step.id === 'sale' &&
              !didCompleteRef.current
            ) {
              didCompleteRef.current = true;

              // remove offer from cache
              queryClient.setQueryData(
                nftOffersQueryKey({ address: accountAddress }),
                (
                  cachedData: { nftOffers: NftOffer[] | undefined } | undefined
                ) => {
                  return {
                    nftOffers: cachedData?.nftOffers?.filter(
                      cachedOffer =>
                        cachedOffer.nft.uniqueId !== offer.nft.uniqueId
                    ),
                  };
                }
              );

              logger.info(
                `Completed sale of NFT ${offer.nft.contractAddress}:${offer.nft.tokenId}`
              );
              analyticsV2.track(analyticsV2.event.nftOffersAcceptedOffer, {
                status: 'completed',
                ...analyticsEventObject,
              });
            }
          });
        });
      },
    });
    navigate(Routes.PROFILE_SCREEN);
  }, [
    accountAddress,
    dispatch,
    feeParam,
    navigate,
    network,
    nft,
    offer,
    rainbowFeeDecimal,
  ]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <View onLayout={e => setHeight(e.nativeEvent.layout.height)}>
            <Inset top="32px" horizontal="28px" bottom="52px">
              <Inset bottom="36px">
                <Text color="label" align="center" size="20pt" weight="heavy">
                  {i18n.t(i18n.l.nft_offers.single_offer_sheet.title)}
                </Text>
                <Inset top="10px">
                  {timeRemaining !== undefined && (
                    <Inline
                      space="4px"
                      alignHorizontal="center"
                      alignVertical="center"
                    >
                      <Text
                        color={
                          isExpiring || isExpired ? 'red' : 'labelTertiary'
                        }
                        align="center"
                        size="13pt"
                        weight="semibold"
                      >
                        {isExpired ? '􀇾' : '􀐫'}
                      </Text>
                      <Text
                        color={
                          isExpiring || isExpired ? 'red' : 'labelTertiary'
                        }
                        align="center"
                        size="15pt"
                        weight="semibold"
                      >
                        {isExpired
                          ? i18n.t(i18n.l.nft_offers.single_offer_sheet.expired)
                          : i18n.t(
                              i18n.l.nft_offers.single_offer_sheet.expires_in,
                              {
                                timeLeft: time!,
                              }
                            )}
                      </Text>
                    </Inline>
                  )}
                </Inset>
              </Inset>
              <Box alignItems="center">
                <ButtonPressAnimation
                  disabled={!nft}
                  onPress={() =>
                    navigate(Routes.EXPANDED_ASSET_SHEET, {
                      asset: nft,
                      backgroundOpacity: 1,
                      cornerRadius: 'device',
                      external: false,
                      springDamping: 1,
                      topOffset: 0,
                      transitionDuration: 0.25,
                      type: 'unique_token',
                    })
                  }
                  overflowMargin={100}
                >
                  <ConditionalWrap
                    condition={!!offer.nft.predominantColor}
                    wrap={(children: React.ReactNode) => (
                      <AccentColorProvider color={offer.nft.predominantColor!}>
                        {children}
                      </AccentColorProvider>
                    )}
                  >
                    <Box
                      as={ImgixImage}
                      background="surfaceSecondaryElevated"
                      source={{ uri: offer.nft.imageUrl }}
                      width={{
                        custom: NFT_IMAGE_HEIGHT,
                      }}
                      height={{
                        custom: offer.nft.aspectRatio
                          ? NFT_IMAGE_HEIGHT / offer.nft.aspectRatio
                          : NFT_IMAGE_HEIGHT,
                      }}
                      borderRadius={16}
                      size={CardSize}
                      shadow={
                        offer.nft.predominantColor ? '30px accent' : '30px'
                      }
                    />
                  </ConditionalWrap>
                </ButtonPressAnimation>
              </Box>

              <Inset top={{ custom: 40 }} bottom="24px">
                <Columns alignVertical="center">
                  <Column>
                    <Text color="label" size="17pt" weight="bold">
                      {offer.nft.name}
                    </Text>
                    <Inset top="10px">
                      <Text color="labelTertiary" size="13pt" weight="medium">
                        {offer.nft.collectionName}
                      </Text>
                    </Inset>
                  </Column>
                  <Column>
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <CoinIcon
                        address={offer.paymentToken.address}
                        size={16}
                        symbol={offer.paymentToken.symbol}
                      />

                      <Text
                        color="label"
                        align="right"
                        size="17pt"
                        weight="bold"
                      >
                        {listPrice} {offer.paymentToken.symbol}
                      </Text>
                    </Inline>

                    <Inset top="6px">
                      <Inline alignHorizontal="right">
                        <Text
                          size="13pt"
                          weight="medium"
                          color={
                            isFloorDiffPercentagePositive
                              ? 'green'
                              : 'labelTertiary'
                          }
                        >
                          {`${isFloorDiffPercentagePositive ? '+' : ''}${
                            offer.floorDifferencePercentage
                          }% `}
                        </Text>
                        <Text size="13pt" weight="medium" color="labelTertiary">
                          {i18n.t(
                            isFloorDiffPercentagePositive
                              ? i18n.l.nft_offers.sheet.above_floor
                              : i18n.l.nft_offers.sheet.below_floor
                          )}
                        </Text>
                      </Inline>
                    </Inset>
                  </Column>
                </Columns>
              </Inset>

              <Separator color="separatorTertiary" />

              <Inset top="24px">
                <Row
                  symbol="􀐾"
                  label={i18n.t(
                    i18n.l.nft_offers.single_offer_sheet.floor_price
                  )}
                  value={
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <CoinIcon
                        address={offer.floorPrice.paymentToken.address}
                        size={16}
                        symbol={offer.floorPrice.paymentToken.symbol}
                      />

                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {floorPrice} {offer.floorPrice.paymentToken.symbol}
                      </Text>
                    </Inline>
                  }
                />

                <Row
                  symbol="􀍩"
                  label={i18n.t(
                    i18n.l.nft_offers.single_offer_sheet.marketplace
                  )}
                  value={
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <Box
                        as={ImgixImage}
                        background="surfaceSecondaryElevated"
                        source={{ uri: offer.marketplace.imageUrl }}
                        width={{ custom: 16 }}
                        height={{ custom: 16 }}
                        borderRadius={16}
                        size={16}
                        // shadow is way off on android idk why
                        shadow={IS_ANDROID ? undefined : '30px accent'}
                      />
                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {offer.marketplace.name}
                      </Text>
                    </Inline>
                  }
                />
                {!!feesPercentage && (
                  <Row
                    symbol="􀘾"
                    label={i18n.t(
                      i18n.l.nft_offers.single_offer_sheet.marketplace_fees,
                      { marketplace: offer.marketplace.name }
                    )}
                    value={
                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {feesPercentage}%
                      </Text>
                    }
                  />
                )}
                {!!royaltiesPercentage && (
                  <Row
                    symbol="􀣶"
                    label={i18n.t(
                      i18n.l.nft_offers.single_offer_sheet.creator_royalties
                    )}
                    value={
                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {royaltiesPercentage}%
                      </Text>
                    }
                  />
                )}
                {/* <Row
                symbol="􀖅"
                label={i18n.t(i18n.l.nft_offers.single_offer_sheet.receive)}
                value={
                  <Text
                    color="labelSecondary"
                    align="right"
                    size="17pt"
                    weight="medium"
                  >
                    {offer.paymentToken.symbol}
                  </Text>
                }
              /> */}
              </Inset>

              <Separator color="separatorTertiary" />

              <Inset vertical="24px">
                <Columns alignVertical="center">
                  <Column>
                    <Text color="label" size="17pt" weight="bold">
                      {i18n.t(i18n.l.nft_offers.single_offer_sheet.proceeds)}
                    </Text>
                  </Column>
                  <Column>
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <CoinIcon
                        address={offer.paymentToken.address}
                        size={16}
                        symbol={offer.paymentToken.symbol}
                      />

                      <Text
                        color="label"
                        align="right"
                        size="17pt"
                        weight="bold"
                      >
                        {netCrypto} {offer.paymentToken.symbol}
                      </Text>
                    </Inline>

                    <Inset top="10px">
                      <Text
                        color="labelSecondary"
                        align="right"
                        size="13pt"
                        weight="semibold"
                      >
                        {netCurrency}
                      </Text>
                    </Inset>
                  </Column>
                </Columns>
              </Inset>
              {isReadOnlyWallet || isExpired ? (
                <AccentColorProvider
                  color={offer.nft.predominantColor || buttonColorFallback}
                >
                  {/* @ts-ignore js component */}
                  <Box
                    as={ButtonPressAnimation}
                    background="accent"
                    height="46px"
                    // @ts-ignore
                    disabled={isExpired}
                    width="full"
                    borderRadius={99}
                    justifyContent="center"
                    alignItems="center"
                    style={{ overflow: 'hidden' }}
                    onPress={() => {
                      analyticsV2.track(
                        analyticsV2.event.nftOffersViewedExternalOffer,
                        {
                          marketplace: offer.marketplace.name,
                          offerValueUSD: offer.grossAmount.usd,
                          offerValue: offer.grossAmount.decimal,
                          offerCurrency: {
                            symbol: offer.paymentToken.symbol,
                            contractAddress: offer.paymentToken.address,
                          },
                          floorDifferencePercentage:
                            offer.floorDifferencePercentage,
                          nft: {
                            contractAddress: offer.nft.contractAddress,
                            tokenId: offer.nft.tokenId,
                            network: offer.network,
                          },
                        }
                      );
                      Linking.openURL(offer.url);
                    }}
                  >
                    <Text
                      color="label"
                      align="center"
                      size="17pt"
                      weight="heavy"
                    >
                      {i18n.t(
                        isExpired
                          ? i18n.l.nft_offers.single_offer_sheet.offer_expired
                          : i18n.l.nft_offers.single_offer_sheet.view_offer
                      )}
                    </Text>
                  </Box>
                </AccentColorProvider>
              ) : (
                <>
                  {/* @ts-ignore */}
                  <HoldToAuthorizeButton
                    backgroundColor={
                      offer.nft.predominantColor || buttonColorFallback
                    }
                    disabled={!isSufficientGas || !isValidGas}
                    hideInnerBorder
                    label={
                      insufficientEth
                        ? i18n.t(
                            i18n.l.button.confirm_exchange.insufficient_eth
                          )
                        : i18n.t(
                            i18n.l.nft_offers.single_offer_sheet.hold_to_sell
                          )
                    }
                    onLongPress={acceptOffer}
                    parentHorizontalPadding={28}
                    showBiometryIcon={!insufficientEth}
                  />
                  {/* @ts-ignore */}
                  <GasSpeedButton
                    asset={{
                      color: offer.nft.predominantColor || buttonColorFallback,
                    }}
                    horizontalPadding={0}
                    currentNetwork={offer.network}
                    theme={isDarkMode ? 'dark' : 'light'}
                  />
                </>
              )}
            </Inset>
          </View>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
