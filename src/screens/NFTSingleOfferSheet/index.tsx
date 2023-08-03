import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
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
import { TransactionStatus, TransactionType, UniqueAsset } from '@/entities';
import { analyticsV2 } from '@/analytics';
import { RAINBOW_ROUTER_CONTRACT_ADDRESS } from '@rainbow-me/swaps';
import { BigNumber } from '@ethersproject/bignumber';
import { HoldToAuthorizeButton } from '@/components/buttons';
import { GasSpeedButton } from '@/components/gas';
import { loadPrivateKey } from '@/model/wallet';
import { Network } from '@/helpers';
import { Execute, getClient } from '@reservoir0x/reservoir-sdk';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { WalletClient, createWalletClient, http } from 'viem';
import { useDispatch } from 'react-redux';
import { dataAddNewTransaction } from '@/redux/data';
import { getNetworkObj } from '@/networks';
import { logger } from '@/logger';
import { estimateGasWithPadding, getProviderForNetwork } from '@/handlers/web3';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

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
    <Box height={{ custom: 36 }} alignItems="center">
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
  // const x = useGas();
  const { data: nfts } = useLegacyNFTs({ address: accountAddress });
  const dispatch = useDispatch();
  const [signer, setSigner] = useState<WalletClient>();

  const { offer } = params as { offer: NftOffer };

  const txsRef = useRef<string[]>([]);

  const [height, setHeight] = useState(0);

  const nft = useMemo(() => {
    if (nfts) {
      return nfts.find(
        (nft: UniqueAsset) => nft.fullUniqueId === offer.nft.uniqueId
      );
    }
  }, [nfts, offer.nft.uniqueId]);

  useEffect(() => {
    (async () => {
      const privateKey = await loadPrivateKey(accountAddress, false);
      const account = privateKeyToAccount(privateKey);
      const reservoirSigner = createWalletClient({
        account,
        chain: mainnet,
        transport: http(getNetworkObj(offer.network as Network).rpc),
      });
      setSigner(reservoirSigner);
    })();
  }, [accountAddress, offer.network]);

  // const rawGasLimit = await estimateGasWithPadding(
  //   txPayload,
  //   null,
  //   null,
  //   provider
  // );
  // logger.debug(
  //   'WC: Estimated gas limit',
  //   { rawGasLimit },
  //   logger.DebugContext.walletconnect
  // );
  // if (rawGasLimit) {
  //   gas = toHex(rawGasLimit);
  // }

  useEffect(() => {
    if (signer) {
      getClient()?.actions.acceptOffer({
        items: [
          {
            token: `${offer.nft.contractAddress}:${offer.nft.tokenId}`,
            quantity: 1,
          },
        ],
        options: {
          feesOnTop: [
            `${RAINBOW_ROUTER_CONTRACT_ADDRESS}:${BigNumber.from(
              offer.grossAmount.raw
            )
              .div(100)
              .toString()}`,
          ],
        },
        precheck: true,
        wallet: signer,
        onProgress: (steps: Execute['steps']) => {
          console.log('progress3');
          steps.forEach(step =>
            step.items?.forEach(async item => {
              if (item.data?.data && item.data?.to && item.data?.from) {
                console.log('item', item);
                console.log('step', step);
                const rawGasLimit = await estimateGasWithPadding(
                  {
                    to: item.data.to,
                    from: item.data.from,
                    data: item.data.data,
                  },
                  null,
                  null,
                  await getProviderForNetwork(offer.network as Network)
                );
                console.log('rawGasLimit', rawGasLimit);
              }
            })
          );
        },
      });
    }
  }, [
    offer.grossAmount.raw,
    offer.network,
    offer.nft.contractAddress,
    offer.nft.tokenId,
    signer,
  ]);

  useEffect(() => {
    setParams({ longFormHeight: height });
  }, [height, setParams]);

  const [timeRemaining, setTimeRemaining] = useState(
    offer.validUntil
      ? Math.max(offer.validUntil * 1000 - Date.now(), 0)
      : undefined
  );

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
    offer.grossAmount.decimal >= 10_000
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

  useEffect(() => {
    if (offer.validUntil) {
      const interval = setInterval(() => {
        setTimeRemaining(Math.max(offer.validUntil * 1000 - Date.now(), 0));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [offer.validUntil]);
  const isExpiring =
    timeRemaining !== undefined && timeRemaining <= TWO_HOURS_MS;
  const isExpired = timeRemaining === 0;
  const time = timeRemaining
    ? getFormattedTimeQuantity(timeRemaining)
    : undefined;
  const buttonColorFallback = useForegroundColor('accent');

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          backgroundColor={backgroundColor as string}
          scrollEnabled={false}
        >
          <View onLayout={e => setHeight(e.nativeEvent.layout.height)}>
            <Inset top="32px" horizontal="28px" bottom="52px">
              <Inset bottom={{ custom: 36 }}>
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
                      width={{ custom: 160 }}
                      height={{ custom: 160 }}
                      borderRadius={16}
                      size={160}
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
                        address={offer.paymentToken.address}
                        size={16}
                        symbol={offer.paymentToken.symbol}
                      />

                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {floorPrice} {offer.paymentToken.symbol}
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
                      {Math.floor(offer.feesPercentage * 10) / 10}%
                    </Text>
                  }
                />

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
                      {Math.floor(offer.royaltiesPercentage * 10) / 10}%
                    </Text>
                  }
                />

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
                        color="labelTertiary"
                        align="right"
                        size="13pt"
                        weight="medium"
                      >
                        {netCurrency}
                      </Text>
                    </Inset>
                  </Column>
                </Columns>
              </Inset>
              {isReadOnlyWallet ? (
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
                          offerPriceUSD: offer.grossAmount.usd,
                          nft: {
                            collectionAddress: offer.nft.contractAddress,
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
                  <HoldToAuthorizeButton
                    backgroundColor={
                      offer.nft.predominantColor || buttonColorFallback
                    }
                    disabled={!signer}
                    // disabled={!isSufficientGas || !isValidGas}
                    hideInnerBorder
                    // label={
                    //   insufficientEth
                    //     ? lang.t('profiles.confirm.insufficient_eth')
                    //     : label
                    // }
                    label="Hold to sell"
                    onLongPress={async () => {
                      logger.info(
                        `Initiating sale of NFT ${offer.nft.contractAddress}:${offer.nft.tokenId}`
                      );
                      getClient()?.actions.acceptOffer({
                        items: [
                          {
                            token: `${offer.nft.contractAddress}:${offer.nft.tokenId}`,
                            quantity: 1,
                          },
                        ],
                        // options: {
                        //   feesOnTop: [
                        //     `${RAINBOW_ROUTER_CONTRACT_ADDRESS}:${BigNumber.from(
                        //       offer.grossAmount.raw
                        //     )
                        //       .div(100)
                        //       .toString()}`,
                        //   ],
                        // },
                        precheck: true,
                        wallet: signer,
                        onProgress: (steps: Execute['steps']) => {
                          steps.forEach(step =>
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
                              }
                            })
                          );
                          navigate(Routes.PROFILE_SCREEN);
                        },
                      });
                    }}
                    parentHorizontalPadding={28}
                    // showBiometryIcon={!insufficientEth}
                    showBiometryIcon
                    // testID={`ens-transaction-action-${testID}`}
                  />
                  <GasSpeedButton
                    asset={{
                      color: offer.nft.predominantColor || buttonColorFallback,
                    }}
                    currentNetwork="mainnet"
                    theme="light"
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
