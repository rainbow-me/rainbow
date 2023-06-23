import React, { useCallback, useEffect, useState } from 'react';
import { SlackSheet } from '@/components/sheet';
import { useDimensions } from '@/hooks';
import { BackgroundProvider, Box, Inline, Stack, Text } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_ANDROID, IS_IOS } from '@/env';
import { Linking, StatusBar } from 'react-native';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { analyticsV2 } from '@/analytics';
import { RainbowPosition, usePositions } from '@/resources/defi/PositionsQuery';
import { CoinIcon, RequestVendorLogoIcon } from '@/components/coin-icon';
import startCase from 'lodash/startCase';
import { useTheme } from '@/theme';
import { ButtonPressAnimation } from '@/components/animations';
import { AssetType } from '@/entities';
import {
  convertAmountToPercentageDisplay,
  convertAmountToPercentageDisplayWithThreshold,
  convertRawAmountToRoundedDecimal,
} from '@/helpers/utilities';
import { POSstyles } from '@/components/positions/PositionsCard';

const DEPOSIT_ITEM_HEIGHT = 80;
const BORROW_ITEM_HEIGHT = 80;
const CLAIMABLE_ITEM_HEIGHT = 10;

export function getPositionSheetHeight({
  position,
}: {
  position: RainbowPosition;
}) {
  console.log('inside: ', { position });
  let height = android ? 140 : 120;
  const numberOfDeposits = position?.deposits?.length || 0;
  const numberOfBorrows = position?.borrows?.length || 0;
  const numberOfClaimables = position?.claimables?.length || 0;

  height += numberOfDeposits * DEPOSIT_ITEM_HEIGHT;
  height += numberOfBorrows * BORROW_ITEM_HEIGHT;
  height += numberOfClaimables * CLAIMABLE_ITEM_HEIGHT;

  console.log('height for ', position?.type, ' is ', height);
  return height;
}

export const PositionSheet: React.FC = () => {
  const { params } = useRoute();
  const { colors } = useTheme();
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();
  const accountAddress = useSelector(
    (state: AppState) => state.settings.accountAddress
  );
  const nativeCurrency = useSelector(
    (state: AppState) => state.settings.nativeCurrency
  );
  const [isLoading, setIsLoading] = useState(true);
  const { data, isLoading: queryIsLoading, isLoadingError } = usePositions({
    address: accountAddress,
    currency: nativeCurrency,
  });
  console.log({ params });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const position: RainbowPosition = params.position!;

  // TODO: For now we are disabling using the asset price in native currency
  //  we will use the fallback which is price in USD provided by backend
  // const assetPriceInNativeCurrency = useMemo(() => {
  //   const assetCode = data?.rewards?.meta.token.asset.assetCode;
  //
  //   if (!assetCode) {
  //     return undefined;
  //   }
  //
  //   return ethereumUtils.getAssetPrice(assetCode);
  // }, [data?.rewards?.meta.token.asset]);

  useEffect(() => {
    setIsLoading(queryIsLoading);
  }, [queryIsLoading]);

  useFocusEffect(
    useCallback(() => {
      analyticsV2.track(analyticsV2.event.rewardsViewedSheet);
    }, [])
  );

  const positionColor = POSstyles[position.type].color;

  const openDapp = useCallback(() => {
    console.log('opening: ', POSstyles[position.type].website);
    Linking.openURL(POSstyles[position.type].website);
  }, [position.type]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        // @ts-expect-error JS component
        <SlackSheet
          backgroundColor={backgroundColor}
          additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
          {...(IS_IOS && { height: '100%' })}
          contentHeight={height - top - 100}
          scrollEnabled
        >
          <Box padding="20px" width="full">
            <Stack space="52px">
              <Inline alignHorizontal="justify">
                <Inline horizontalSpace={'10px'}>
                  {/* @ts-ignore js component*/}
                  <RequestVendorLogoIcon
                    backgroundColor={
                      position.type === 'compound'
                        ? colors.transparent
                        : positionColor
                    }
                    dappName={startCase(position.type.split('-')[0])}
                    size={48}
                    imageUrl={POSstyles[position.type].url}
                  />
                  <Stack space={'10px'}>
                    <Text
                      size="15pt"
                      weight="heavy"
                      color={{ custom: positionColor }}
                    >
                      {startCase(position.type.split('-')[0])}
                    </Text>
                    <Text size="26pt" weight="heavy" color="label">
                      {position.totals.totals.display}
                    </Text>
                  </Stack>
                </Inline>
                <ButtonPressAnimation onPress={openDapp}>
                  <Box
                    style={{
                      backgroundColor: colors.alpha(positionColor, 0.08),
                      borderRadius: 20,
                    }}
                    justifyContent="center"
                    padding="12px"
                  >
                    <Text
                      size="17pt"
                      weight="heavy"
                      color={{ custom: positionColor }}
                    >
                      Open 􀮶
                    </Text>
                  </Box>
                </ButtonPressAnimation>
              </Inline>

              <Stack space={'24px'}>
                <Text size="17pt" weight="heavy" color="label">
                  Deposits
                </Text>
                {position?.deposits?.map(deposit => {
                  const greenOrGrey =
                    (deposit.underlying[0].asset.price?.relative_change_24h ||
                      0) < 0
                      ? colors.blueGreyDark60
                      : colors.green;
                  return (
                    <Inline
                      key={`${deposit.underlying[0].asset.symbol}-${deposit.underlying[0].quantity}`}
                      alignHorizontal="justify"
                      alignVertical="center"
                    >
                      <Inline alignVertical="center" horizontalSpace={'10px'}>
                        <CoinIcon
                          address={deposit.underlying[0].asset.asset_code}
                          type={AssetType.token}
                          symbol={deposit.underlying[0].asset.symbol}
                        />
                        <Stack space="10px">
                          <Text size="17pt" weight="bold" color="label">
                            {deposit.underlying[0].asset.name}
                          </Text>
                          <Inline
                            alignVertical="center"
                            horizontalSpace={'6px'}
                          >
                            <Text
                              size="17pt"
                              weight="semibold"
                              color="labelTertiary"
                            >
                              {`${convertRawAmountToRoundedDecimal(
                                deposit.underlying[0].quantity,
                                deposit.underlying[0].asset.decimals,
                                3
                              )} ${deposit.underlying[0].asset.symbol}`}
                            </Text>
                            <Box
                              style={{
                                backgroundColor: colors.alpha(
                                  positionColor,
                                  0.08
                                ),
                                borderRadius: 20,
                              }}
                              justifyContent="center"
                              padding="6px"
                            >
                              <Text
                                size="13pt"
                                weight="bold"
                                color={{ custom: positionColor }}
                              >
                                {`${convertAmountToPercentageDisplayWithThreshold(
                                  deposit.apy
                                )} APY`}
                              </Text>
                            </Box>
                          </Inline>
                        </Stack>
                      </Inline>
                      <Stack space="10px">
                        <Text size="17pt" weight="medium" color="label">
                          {deposit.underlying[0].native.display}
                        </Text>
                        <Text
                          size="13pt"
                          weight="medium"
                          color={{ custom: greenOrGrey }}
                          align="right"
                        >
                          {convertAmountToPercentageDisplay(
                            `${deposit.underlying[0].asset.price?.relative_change_24h}`
                          )}
                        </Text>
                      </Stack>
                    </Inline>
                  );
                })}

                {(position?.borrows?.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    Borrows
                  </Text>
                )}
                {position?.borrows?.map(deposit => {
                  const greenOrGrey =
                    (deposit.underlying[0].asset.price?.relative_change_24h ||
                      0) < 0
                      ? colors.blueGreyDark60
                      : colors.green;

                  return (
                    <Inline
                      key={`${deposit.underlying[0].asset.symbol}-${deposit.underlying[0].quantity}`}
                      alignHorizontal="justify"
                      alignVertical="center"
                    >
                      <Inline alignVertical="center" horizontalSpace={'10px'}>
                        <CoinIcon
                          address={deposit.underlying[0].asset.asset_code}
                          type={AssetType.token}
                          symbol={deposit.underlying[0].asset.symbol}
                        />
                        <Stack space="10px">
                          <Text size="17pt" weight="bold" color="label">
                            {deposit.underlying[0].asset.name}
                          </Text>
                          <Inline
                            alignVertical="center"
                            horizontalSpace={'6px'}
                          >
                            <Text
                              size="17pt"
                              weight="semibold"
                              color="labelTertiary"
                            >
                              {`${convertRawAmountToRoundedDecimal(
                                deposit.underlying[0].quantity,
                                deposit.underlying[0].asset.decimals,
                                3
                              )} ${deposit.underlying[0].asset.symbol}`}
                            </Text>
                            <Box
                              style={{
                                backgroundColor: colors.alpha(
                                  positionColor,
                                  0.08
                                ),
                                borderRadius: 20,
                              }}
                              justifyContent="center"
                              padding="6px"
                            >
                              <Text
                                size="13pt"
                                weight="bold"
                                color={{ custom: positionColor }}
                              >
                                {`${convertAmountToPercentageDisplayWithThreshold(
                                  deposit.apy
                                )} APY`}
                              </Text>
                            </Box>
                          </Inline>
                        </Stack>
                      </Inline>
                      <Stack space="10px">
                        <Text size="17pt" weight="medium" color="label">
                          {deposit.underlying[0].native.display}
                        </Text>
                        <Text
                          size="13pt"
                          weight="medium"
                          color={{ custom: greenOrGrey }}
                          align="right"
                        >
                          {convertAmountToPercentageDisplay(
                            `${deposit.underlying[0].asset.price?.relative_change_24h}`
                          )}
                        </Text>
                      </Stack>
                    </Inline>
                  );
                })}
              </Stack>
            </Stack>
          </Box>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
