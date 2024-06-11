import React, { useCallback, useEffect, useRef, useState } from 'react';
import lang from 'i18n-js';
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
import { getFormattedTimeQuantity, convertAmountToNativeDisplay, handleSignificantDecimals } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { NftOffer } from '@/graphql/__generated__/arc';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import { IS_ANDROID } from '@/env';
import ConditionalWrap from 'conditional-wrap';
import Routes from '@/navigation/routesNames';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings, useGas, useWallets } from '@/hooks';
import { NewTransaction } from '@/entities';
import { analyticsV2 } from '@/analytics';
import { BigNumber } from '@ethersproject/bignumber';
import { HoldToAuthorizeButton } from '@/components/buttons';
import { GasSpeedButton } from '@/components/gas';
import { loadPrivateKey } from '@/model/wallet';
import { Execute, getClient } from '@reservoir0x/reservoir-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';

import { RainbowError, logger } from '@/logger';
import { useTheme } from '@/theme';
import { Network } from '@/helpers';
import { getNetworkObj } from '@/networks';
import { CardSize } from '@/components/unique-token/CardSize';
import { queryClient } from '@/react-query';
import { nftOffersQueryKey } from '@/resources/reservoir/nftOffersQuery';
import { getRainbowFeeAddress } from '@/resources/reservoir/utils';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { addNewTransaction } from '@/state/pendingTransactions';
import { getUniqueId } from '@/utils/ethereumUtils';
import { getNextNonce } from '@/state/nonces';
import { metadataPOSTClient } from '@/graphql';
import { ethUnits } from '@/references';
import { Transaction } from '@/graphql/__generated__/metadataPOST';

const NFT_IMAGE_HEIGHT = 160;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const RAINBOW_FEE_BIPS = 85;
const BIPS_TO_DECIMAL_RATIO = 10000;

function Row({ symbol, label, value }: { symbol: string; label: string; value: React.ReactNode }) {
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
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { isReadOnlyWallet } = useWallets();
  const theme = useTheme();
  const { updateTxFee, startPollingGasFees, stopPollingGasFees, isSufficientGas, isValidGas } = useGas();
  const {
    data: { nftsMap },
  } = useLegacyNFTs({ address: accountAddress });

  const { offer } = params as { offer: NftOffer };

  const { data: externalAsset } = useExternalToken({
    address: offer.paymentToken.address,
    network: offer.network as Network,
    currency: nativeCurrency,
  });

  const [isGasReady, setIsGasReady] = useState<boolean>(false);
  const [height, setHeight] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const txsRef = useRef<string[]>([]);

  const nft = nftsMap[offer.nft.uniqueId];

  const insufficientEth = isSufficientGas === false && isValidGas;

  const network = offer.network as Network;
  const rainbowFeeAddress = getRainbowFeeAddress(network);
  const rainbowFeeDecimal = (offer.grossAmount.decimal * RAINBOW_FEE_BIPS) / BIPS_TO_DECIMAL_RATIO;
  const feeParam = rainbowFeeAddress
    ? `${rainbowFeeAddress}:${BigNumber.from(offer.grossAmount.raw).mul(RAINBOW_FEE_BIPS).div(BIPS_TO_DECIMAL_RATIO).toString()}`
    : undefined;

  const [timeRemaining, setTimeRemaining] = useState(offer.validUntil ? Math.max(offer.validUntil * 1000 - Date.now(), 0) : undefined);
  const isExpiring = timeRemaining !== undefined && timeRemaining <= TWO_HOURS_MS;
  const isExpired = timeRemaining === 0;
  const time = timeRemaining ? getFormattedTimeQuantity(timeRemaining) : undefined;

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
    try {
      const networkObj = getNetworkObj(network);
      const signer = createWalletClient({
        // @ts-ignore
        account: accountAddress,
        chain: networkObj,
        transport: http(networkObj.rpc()),
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
          let reservoirEstimate = 0;
          const txs: Transaction[] = [];
          const fallbackEstimate =
            offer.network === Network.mainnet ? ethUnits.mainnet_nft_offer_gas_fee_fallback : ethUnits.l2_nft_offer_gas_fee_fallback;
          steps.forEach(step =>
            step.items?.forEach(item => {
              if (item?.data?.to && item?.data?.from && item?.data?.data) {
                txs.push({
                  to: item.data.to,
                  from: item.data.from,
                  data: item.data.data,
                  value: item.data.value ?? '0x0',
                });
              }
              // @ts-ignore missing from reservoir type
              const txEstimate = item.gasEstimate;
              if (typeof txEstimate === 'number') {
                reservoirEstimate += txEstimate;
              }
            })
          );
          const txSimEstimate = parseInt(
            (
              await metadataPOSTClient.simulateTransactions({
                chainId: networkObj.id,
                transactions: txs,
              })
            )?.simulateTransactions?.[0]?.gas?.estimate ?? '0x0',
            16
          );
          const estimate = txSimEstimate || reservoirEstimate || fallbackEstimate;
          if (estimate) {
            updateTxFee(estimate, null);
            setIsGasReady(true);
          }
        },
      });
    } catch {
      logger.error(new RainbowError('NFT Offer: Failed to estimate gas'));
    }
  }, [accountAddress, feeParam, network, offer, updateTxFee]);

  // estimate gas
  useEffect(() => {
    if (!isReadOnlyWallet && !isExpired) {
      startPollingGasFees(network);
      estimateGas();
    }
    return () => {
      stopPollingGasFees();
    };
  }, [estimateGas, isExpired, isReadOnlyWallet, network, startPollingGasFees, stopPollingGasFees, updateTxFee]);

  const acceptOffer = useCallback(async () => {
    logger.info(`Initiating sale of NFT ${offer.nft.contractAddress}:${offer.nft.tokenId}`);
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
      transport: http(networkObj.rpc()),
    });
    const nonce = await getNextNonce({ address: accountAddress, network });
    try {
      let errorMessage = '';
      let didComplete = false;
      await getClient()?.actions.acceptOffer({
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
          setIsAccepting(true);
          steps.forEach(step => {
            if (errorMessage) return;
            if (step.error && !errorMessage) {
              errorMessage = step.error;
              return;
            }
            step.items?.forEach(item => {
              if (item.txHashes?.[0].txHash && !txsRef.current.includes(item.txHashes?.[0].txHash) && item.status === 'incomplete') {
                let tx: NewTransaction | null = null;
                const asset = {
                  ...nft,
                  address: offer.nft.contractAddress,
                  symbol: 'NFT',
                  decimals: 18,
                };
                if (step.id === 'sale') {
                  tx = {
                    status: 'pending',
                    to: item.data?.to,
                    from: item.data?.from,
                    hash: item.txHashes[0].txHash,
                    network: offer.network as Network,
                    nonce: item?.txHashes?.length > 1 ? nonce + 1 : nonce,
                    asset: {
                      ...offer.paymentToken,
                      network: offer.network as Network,
                      uniqueId: getUniqueId(offer.paymentToken.address, offer.network as Network),
                    },
                    changes: [
                      {
                        direction: 'out',
                        asset,
                        value: 1,
                      },
                      {
                        direction: 'in',
                        asset: {
                          ...offer.paymentToken,
                          network: offer.network as Network,
                          uniqueId: getUniqueId(offer.paymentToken.address, offer.network as Network),
                        },
                        value: offer.grossAmount.raw,
                      },
                    ],
                    type: 'sale',
                  };
                } else if (step.id === 'nft-approval') {
                  tx = {
                    status: 'pending',
                    to: item.data?.to,
                    from: item.data?.from,
                    hash: item.txHashes[0].txHash,
                    network: offer.network as Network,
                    nonce,
                    asset,
                    type: 'approve',
                  };
                }
                if (tx) {
                  addNewTransaction({
                    transaction: tx,
                    address: accountAddress,
                    network: offer.network as Network,
                  });
                  txsRef.current.push(tx.hash);
                }
              } else if (item.status === 'complete' && step.id === 'sale' && !didComplete) {
                didComplete = true;
              }
            });
          });
        },
      });
      if (errorMessage || !didComplete) throw new Error(errorMessage);

      // remove offer from cache
      queryClient.setQueryData(
        nftOffersQueryKey({ walletAddress: accountAddress }),
        (cachedData: { nftOffers: NftOffer[] | undefined } | undefined) => {
          return {
            nftOffers: cachedData?.nftOffers?.filter(cachedOffer => cachedOffer.nft.uniqueId !== offer.nft.uniqueId),
          };
        }
      );

      logger.info(`Completed sale of NFT ${offer.nft.contractAddress}:${offer.nft.tokenId}`);
      analyticsV2.track(analyticsV2.event.nftOffersAcceptedOffer, {
        status: 'completed',
        ...analyticsEventObject,
      });

      navigate(Routes.PROFILE_SCREEN);
    } catch (e) {
      logger.error(
        new RainbowError(
          `Error selling NFT ${offer.nft.contractAddress} #${offer.nft.tokenId} on marketplace ${offer.marketplace.name}: ${e}`
        )
      );
      analyticsV2.track(analyticsV2.event.nftOffersAcceptedOffer, {
        status: 'failed',
        ...analyticsEventObject,
      });
      Alert.alert(i18n.t(i18n.l.nft_offers.single_offer_sheet.error.title), i18n.t(i18n.l.nft_offers.single_offer_sheet.error.message), [
        {
          onPress: () => navigate(Routes.NFT_SINGLE_OFFER_SHEET, { offer }),
          text: i18n.t(i18n.l.button.go_back),
        },
        {
          text: i18n.t(i18n.l.button.cancel),
        },
      ]);
    } finally {
      setIsAccepting(false);
    }
  }, [accountAddress, feeParam, navigate, network, nft, offer, rainbowFeeDecimal]);

  let buttonLabel = '';
  if (!isAccepting) {
    if (insufficientEth) {
      buttonLabel = lang.t('button.confirm_exchange.insufficient_token', {
        tokenName: getNetworkObj(offer.network as Network).nativeCurrency.symbol,
      });
    } else {
      buttonLabel = i18n.t(i18n.l.nft_offers.single_offer_sheet.hold_to_sell);
    }
  } else {
    buttonLabel = i18n.t(i18n.l.nft_offers.single_offer_sheet.selling);
  }

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
                    <Inline space="4px" alignHorizontal="center" alignVertical="center">
                      <Text color={isExpiring || isExpired ? 'red' : 'labelTertiary'} align="center" size="13pt" weight="semibold">
                        {isExpired ? '􀇾' : '􀐫'}
                      </Text>
                      <Text color={isExpiring || isExpired ? 'red' : 'labelTertiary'} align="center" size="15pt" weight="semibold">
                        {isExpired
                          ? i18n.t(i18n.l.nft_offers.single_offer_sheet.expired)
                          : i18n.t(i18n.l.nft_offers.single_offer_sheet.expires_in, {
                              timeLeft: time!,
                            })}
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
                      <AccentColorProvider color={offer.nft.predominantColor!}>{children}</AccentColorProvider>
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
                        custom: offer.nft.aspectRatio ? NFT_IMAGE_HEIGHT / offer.nft.aspectRatio : NFT_IMAGE_HEIGHT,
                      }}
                      borderRadius={16}
                      size={CardSize}
                      shadow={offer.nft.predominantColor ? '30px accent' : '30px'}
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
                    <Inline space="4px" alignVertical="center" alignHorizontal="right">
                      <RainbowCoinIcon
                        size={16}
                        icon={externalAsset?.icon_url}
                        network={offer?.network as Network}
                        symbol={offer.paymentToken.symbol}
                        theme={theme}
                        colors={externalAsset?.colors}
                        ignoreBadge
                      />
                      <Text color="label" align="right" size="17pt" weight="bold">
                        {listPrice} {offer.paymentToken.symbol}
                      </Text>
                    </Inline>

                    <Inset top="6px">
                      <Inline alignHorizontal="right">
                        <Text size="13pt" weight="medium" color={isFloorDiffPercentagePositive ? 'green' : 'labelTertiary'}>
                          {`${isFloorDiffPercentagePositive ? '+' : ''}${offer.floorDifferencePercentage}% `}
                        </Text>
                        <Text size="13pt" weight="medium" color="labelTertiary">
                          {i18n.t(
                            isFloorDiffPercentagePositive ? i18n.l.nft_offers.sheet.above_floor : i18n.l.nft_offers.sheet.below_floor
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
                  label={i18n.t(i18n.l.nft_offers.single_offer_sheet.floor_price)}
                  value={
                    <Inline space="4px" alignVertical="center" alignHorizontal="right">
                      <RainbowCoinIcon
                        size={16}
                        icon={externalAsset?.icon_url}
                        network={offer?.network as Network}
                        symbol={offer.paymentToken.symbol}
                        theme={theme}
                        colors={externalAsset?.colors}
                        ignoreBadge
                      />

                      <Text color="labelSecondary" align="right" size="17pt" weight="medium">
                        {floorPrice} {offer.floorPrice.paymentToken.symbol}
                      </Text>
                    </Inline>
                  }
                />

                <Row
                  symbol="􀍩"
                  label={i18n.t(i18n.l.nft_offers.single_offer_sheet.marketplace)}
                  value={
                    <Inline space="4px" alignVertical="center" alignHorizontal="right">
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
                      <Text color="labelSecondary" align="right" size="17pt" weight="medium">
                        {offer.marketplace.name}
                      </Text>
                    </Inline>
                  }
                />
                {!!feesPercentage && (
                  <Row
                    symbol="􀘾"
                    label={i18n.t(i18n.l.nft_offers.single_offer_sheet.marketplace_fees, { marketplace: offer.marketplace.name })}
                    value={
                      <Text color="labelSecondary" align="right" size="17pt" weight="medium">
                        {feesPercentage}%
                      </Text>
                    }
                  />
                )}
                {!!royaltiesPercentage && (
                  <Row
                    symbol="􀣶"
                    label={i18n.t(i18n.l.nft_offers.single_offer_sheet.creator_royalties)}
                    value={
                      <Text color="labelSecondary" align="right" size="17pt" weight="medium">
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
                    <Inline space="4px" alignVertical="center" alignHorizontal="right">
                      <RainbowCoinIcon
                        size={16}
                        icon={externalAsset?.icon_url}
                        network={offer?.network as Network}
                        symbol={offer.paymentToken.symbol}
                        theme={theme}
                        colors={externalAsset?.colors}
                        ignoreBadge
                      />
                      <Text color="label" align="right" size="17pt" weight="bold">
                        {netCrypto} {offer.paymentToken.symbol}
                      </Text>
                    </Inline>

                    <Inset top="10px">
                      <Text color="labelSecondary" align="right" size="13pt" weight="semibold">
                        {netCurrency}
                      </Text>
                    </Inset>
                  </Column>
                </Columns>
              </Inset>
              {isReadOnlyWallet || isExpired ? (
                <AccentColorProvider color={offer.nft.predominantColor || buttonColorFallback}>
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
                      analyticsV2.track(analyticsV2.event.nftOffersViewedExternalOffer, {
                        marketplace: offer.marketplace.name,
                        offerValueUSD: offer.grossAmount.usd,
                        offerValue: offer.grossAmount.decimal,
                        offerCurrency: {
                          symbol: offer.paymentToken.symbol,
                          contractAddress: offer.paymentToken.address,
                        },
                        floorDifferencePercentage: offer.floorDifferencePercentage,
                        nft: {
                          contractAddress: offer.nft.contractAddress,
                          tokenId: offer.nft.tokenId,
                          network: offer.network,
                        },
                      });
                      Linking.openURL(offer.url);
                    }}
                  >
                    <Text color="label" align="center" size="17pt" weight="heavy">
                      {i18n.t(
                        isExpired ? i18n.l.nft_offers.single_offer_sheet.offer_expired : i18n.l.nft_offers.single_offer_sheet.view_offer
                      )}
                    </Text>
                  </Box>
                </AccentColorProvider>
              ) : (
                <>
                  {/* @ts-ignore */}
                  <HoldToAuthorizeButton
                    backgroundColor={offer.nft.predominantColor || buttonColorFallback}
                    disabled={!isSufficientGas || !isValidGas}
                    hideInnerBorder
                    label={buttonLabel}
                    onLongPress={acceptOffer}
                    parentHorizontalPadding={28}
                    showBiometryIcon={!insufficientEth}
                  />
                  {/* @ts-ignore */}
                  <GasSpeedButton
                    asset={{
                      color: offer.nft.predominantColor || buttonColorFallback,
                    }}
                    loading={!isGasReady}
                    horizontalPadding={0}
                    currentNetwork={offer.network}
                    theme={theme.isDarkMode ? 'dark' : 'light'}
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
