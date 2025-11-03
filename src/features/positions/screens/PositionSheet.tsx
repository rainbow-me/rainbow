import React, { useCallback } from 'react';
import { SlackSheet } from '@/components/sheet';
import { BackgroundProvider, Box, globalColors, Inline, Separator, Stack, Text, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { RouteProp, useRoute } from '@react-navigation/native';
import { analytics } from '@/analytics';
import { RequestVendorLogoIcon } from '@/components/coin-icon';
import startCase from 'lodash/startCase';
import { useTheme } from '@/theme';
import { ButtonPressAnimation } from '@/components/animations';
import { PositionListItem } from '../components/PositionListItem';
import * as i18n from '@/languages';
import { capitalize } from 'lodash';
import type { RainbowPosition, PositionAsset } from '@/features/positions/types';
import { LpPositionListItem } from '../components/LpPositionListItem';
import { RootStackParamList } from '@/navigation/types';
import { openInBrowser } from '@/utils/openInBrowser';
import Routes from '@/navigation/routesNames';
import { safeAreaInsetValues } from '@/utils';
import { Navigation } from '@/navigation';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { NativeCurrencyKeys } from '@/entities';

const DEPOSIT_ITEM_HEIGHT = 44;
const BORROW_ITEM_HEIGHT = 44;
const CLAIMABLE_ITEM_HEIGHT = 44;
const STAKE_ITEM_HEIGHT = 44;
const ITEM_PADDING = 20;
const SECTION_TITLE_HEIGHT = 20 + ITEM_PADDING;

export function getPositionSheetHeight({ position }: { position: RainbowPosition }) {
  let height = 120 + safeAreaInsetValues.bottom;
  const numberOfDeposits = position.deposits.length || 0;
  const numberOfPools = position.pools.length || 0;
  const numberOfBorrows = position.borrows.length || 0;
  const numberOfClaimables = position.rewards.length || 0;
  const numberOfStakes = position.stakes.length || 0;

  height += numberOfDeposits > 0 ? SECTION_TITLE_HEIGHT + numberOfDeposits * (DEPOSIT_ITEM_HEIGHT + ITEM_PADDING) : 0;
  height += numberOfPools > 0 ? SECTION_TITLE_HEIGHT + numberOfPools * (DEPOSIT_ITEM_HEIGHT + ITEM_PADDING) : 0;
  height += numberOfBorrows > 0 ? SECTION_TITLE_HEIGHT + numberOfBorrows * (BORROW_ITEM_HEIGHT + ITEM_PADDING) : 0;
  height += numberOfClaimables > 0 ? SECTION_TITLE_HEIGHT + numberOfClaimables * (CLAIMABLE_ITEM_HEIGHT + ITEM_PADDING) : 0;
  height += numberOfStakes > 0 ? SECTION_TITLE_HEIGHT + numberOfStakes * (STAKE_ITEM_HEIGHT + ITEM_PADDING) : 0;

  return height;
}

export const PositionSheet: React.FC = () => {
  const {
    params: { position },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POSITION_SHEET>>();
  const { colors } = useTheme();
  const { isDarkMode } = useColorMode();
  const nativeCurrency = userAssetsStoreManager.getState().currency;

  const positionColor =
    position.dapp.colors.primary || position.dapp.colors.fallback || (isDarkMode ? globalColors.white100 : globalColors.white10);

  const openDapp = useCallback(() => {
    analytics.track(analytics.event.positionsOpenedExternalDapp, {
      dapp: position.type,
      protocol: position.protocol,
      url: position.dapp.url,
      positionsValue: position.totals.total.amount,
      positionsCurrency: nativeCurrency,
      ...(nativeCurrency !== NativeCurrencyKeys.USD && { positionsUSDValue: position.totals.total.amount }),
    });
    openInBrowser(position.dapp.url);
  }, [nativeCurrency, position.dapp.url, position.protocol, position.totals.total.amount, position.type]);

  const openTokenSheet = useCallback(
    (asset: PositionAsset, type: 'deposit' | 'stake' | 'borrow' | 'reward' | 'pool', assetValueUSD: string, name?: string) => {
      analytics.track(analytics.event.positionsOpenedAsset, {
        dapp: position.type,
        protocol: position.protocol,
        type,
        name,
        assetSymbol: asset.symbol,
        assetAddress: asset.address,
        assetValue: assetValueUSD,
        assetCurrency: nativeCurrency,
        positionsValue: position.totals.total.amount,
        positionsCurrency: nativeCurrency,
        ...(nativeCurrency !== NativeCurrencyKeys.USD && { assetValueUSD, positionsUSDValue: position.totals.total.amount }),
      });

      Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
        asset,
        address: asset.address,
        chainId: asset.chainId,
      });
    },
    [nativeCurrency, position.protocol, position.totals.total.amount, position.type]
  );

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SlackSheet
          backgroundColor={backgroundColor}
          height={IS_IOS ? '100%' : undefined}
          additionalTopPadding={IS_IOS ? undefined : true}
          contentHeight={IS_IOS ? undefined : getPositionSheetHeight({ position })}
          scrollEnabled
        >
          <Box padding="20px" width="full" paddingBottom={{ custom: 50 }}>
            <Stack space="24px" separator={<Separator color="separatorTertiary" thickness={1} />}>
              <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
                <Box style={{ maxWidth: '58%' }}>
                  <Inline horizontalSpace={'10px'} alignVertical="center" wrap={false}>
                    {/* @ts-expect-error - RequestVendorLogoIcon is a JS component without TypeScript definitions */}
                    <RequestVendorLogoIcon
                      backgroundColor={positionColor}
                      dappName={startCase(position.type.split('-')[0])}
                      size={48}
                      imageUrl={position.dapp.icon_url}
                    />
                    <Stack space={'10px'}>
                      <Text size="15pt" weight="heavy" color={{ custom: positionColor }} numberOfLines={1}>
                        {capitalize(position.dapp.name.replaceAll('-', ' '))}
                      </Text>
                      <Text size="26pt" weight="heavy" color="label" numberOfLines={1}>
                        {position.totals.total.display}
                      </Text>
                    </Stack>
                  </Inline>
                </Box>
                {position.dapp.url && (
                  <ButtonPressAnimation onPress={openDapp}>
                    <Box
                      style={{
                        backgroundColor: colors.alpha(positionColor, 0.08),
                        borderRadius: 20,
                        height: 40,
                      }}
                      justifyContent="center"
                      padding="12px"
                    >
                      <Text size="17pt" weight="heavy" color={{ custom: positionColor }}>
                        {i18n.t(i18n.l.positions.open_dapp)}
                      </Text>
                    </Box>
                  </ButtonPressAnimation>
                )}
              </Inline>

              <Stack space={'20px'}>
                {(position.deposits.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.deposits)}
                  </Text>
                )}
                {position.deposits.map(deposit => (
                  <PositionListItem
                    key={`deposit-${deposit.asset.address}-${deposit.quantity}-${deposit.apy}`}
                    asset={deposit.underlying[0].asset}
                    quantity={deposit.underlying[0].quantity}
                    value={deposit.value}
                    dappVersion={deposit.dappVersion}
                    positionColor={positionColor}
                    apy={deposit.apy}
                    name={'name' in deposit ? deposit.name : undefined}
                    onPress={() =>
                      openTokenSheet(
                        deposit.underlying[0].asset,
                        'deposit',
                        deposit.value.amount,
                        'name' in deposit ? deposit.name : undefined
                      )
                    }
                  />
                ))}

                {(position.pools.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.pools)}
                  </Text>
                )}
                {position.pools.map(pool => (
                  <LpPositionListItem
                    key={`pool-${pool.asset.address}-${pool.quantity}`}
                    assets={pool.underlying}
                    value={pool.value}
                    rangeStatus={pool.rangeStatus}
                    allocation={pool.allocation}
                    dappVersion={pool.dappVersion}
                    name={pool.name}
                    onPress={(asset: PositionAsset) => openTokenSheet(asset, 'pool', pool.value.amount, pool.name)}
                  />
                ))}

                {(position.stakes.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.stakes)}
                  </Text>
                )}
                {position.stakes.map(stake =>
                  stake.isLp ? (
                    <LpPositionListItem
                      key={`stake-${stake.asset.address}-${stake.quantity}`}
                      assets={stake.underlying}
                      value={stake.value}
                      rangeStatus={stake.rangeStatus}
                      allocation={stake.allocation}
                      dappVersion={stake.dappVersion}
                      name={'name' in stake ? stake.name : undefined}
                      onPress={(asset: PositionAsset) =>
                        openTokenSheet(asset, 'stake', stake.value.amount, 'name' in stake ? stake.name : undefined)
                      }
                    />
                  ) : (
                    <PositionListItem
                      key={`stake-${stake.asset.address}-${stake.quantity}`}
                      asset={stake.underlying[0].asset}
                      quantity={stake.underlying[0].quantity}
                      value={stake.value}
                      positionColor={positionColor}
                      apy={stake.apy}
                      name={'name' in stake ? stake.name : undefined}
                      onPress={() =>
                        openTokenSheet(stake.underlying[0].asset, 'stake', stake.value.amount, 'name' in stake ? stake.name : undefined)
                      }
                    />
                  )
                )}

                {(position.borrows.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.borrows)}
                  </Text>
                )}
                {position.borrows.map(borrow => (
                  <PositionListItem
                    key={`borrow-${borrow.underlying[0].asset.address}-${borrow.quantity}-${borrow.apy}`}
                    asset={borrow.underlying[0].asset}
                    quantity={borrow.underlying[0].quantity}
                    value={borrow.value}
                    positionColor={positionColor}
                    apy={borrow.apy}
                    name={'name' in borrow ? borrow.name : undefined}
                    onPress={() =>
                      openTokenSheet(borrow.underlying[0].asset, 'borrow', borrow.value.amount, 'name' in borrow ? borrow.name : undefined)
                    }
                  />
                ))}

                {(position.rewards.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.rewards)}
                  </Text>
                )}
                {position.rewards.map(reward => (
                  <PositionListItem
                    key={`claimable-${reward.asset.address}-${reward.quantity}`}
                    asset={reward.asset}
                    quantity={reward.quantity}
                    value={reward.value}
                    positionColor={positionColor}
                    apy={undefined}
                    name={'name' in reward ? reward.name : undefined}
                    onPress={() => openTokenSheet(reward.asset, 'reward', reward.value.amount, 'name' in reward ? reward.name : undefined)}
                  />
                ))}
              </Stack>
            </Stack>
          </Box>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
