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
import { SubPositionListItem } from '../components/PositionListItem';
import * as i18n from '@/languages';
import { capitalize } from 'lodash';
import { RainbowPosition, PositionAsset } from '@/features/positions/types';
import { LpPositionListItem } from '../components/LpPositionListItem';
import { RootStackParamList } from '@/navigation/types';
import { openInBrowser } from '@/utils/openInBrowser';
import Routes from '@/navigation/routesNames';
import { safeAreaInsetValues } from '@/utils';
import { Navigation } from '@/navigation';
import type { ExpandedSheetParamAsset } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';

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

  const positionColor =
    position.dapp.colors.primary || position.dapp.colors.fallback || (isDarkMode ? globalColors.white100 : globalColors.white10);

  const openDapp = useCallback(() => {
    analytics.track(analytics.event.positionsOpenedExternalDapp, {
      dapp: position.type,
      url: position.dapp.url,
    });
    openInBrowser(position.dapp.url);
  }, [position.dapp.url, position.type]);

  const openTokenSheet = useCallback((asset: PositionAsset) => {
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: asset as unknown as ExpandedSheetParamAsset,
      address: asset.address,
      chainId: asset.chain_id,
    });
  }, []);

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
                        {position.totals.totals.display}
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
                  <SubPositionListItem
                    key={`deposit-${deposit.asset.asset_code}-${deposit.quantity}-${deposit.apy}`}
                    asset={deposit.underlying[0].asset}
                    quantity={deposit.underlying[0].quantity}
                    native={deposit.underlying[0].native}
                    dappVersion={deposit.dappVersion}
                    positionColor={positionColor}
                    apy={deposit.apy}
                    onPress={() => openTokenSheet(deposit.underlying[0].asset)}
                  />
                ))}

                {(position.pools.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.pools)}
                  </Text>
                )}
                {position.pools.map(pool => (
                  <LpPositionListItem
                    key={`pool-${pool.asset.asset_code}-${pool.quantity}`}
                    assets={pool.underlying}
                    totalAssetsValue={pool.totalValue}
                    isConcentratedLiquidity={pool.isConcentratedLiquidity}
                    dappVersion={pool.dappVersion}
                    onPress={() => openTokenSheet(pool.underlying[0].asset)}
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
                      key={`stake-${stake.asset.asset_code}-${stake.quantity}`}
                      assets={stake.underlying}
                      totalAssetsValue={stake.totalValue}
                      isConcentratedLiquidity={stake.isConcentratedLiquidity}
                      dappVersion={stake.dappVersion}
                      onPress={() => openTokenSheet(stake.underlying[0].asset)}
                    />
                  ) : (
                    <SubPositionListItem
                      key={`stake-${stake.asset.asset_code}-${stake.quantity}`}
                      asset={stake.underlying[0].asset}
                      quantity={stake.underlying[0].quantity}
                      native={stake.underlying[0].native}
                      positionColor={positionColor}
                      apy={stake.apy}
                      onPress={() => openTokenSheet(stake.underlying[0].asset)}
                    />
                  )
                )}

                {(position.borrows.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.borrows)}
                  </Text>
                )}
                {position.borrows.map(borrow => (
                  <SubPositionListItem
                    key={`borrow-${borrow.underlying[0].asset.asset_code}-${borrow.quantity}-${borrow.apy}`}
                    asset={borrow.underlying[0].asset}
                    quantity={borrow.underlying[0].quantity}
                    native={borrow.underlying[0].native}
                    positionColor={positionColor}
                    apy={borrow.apy}
                    onPress={() => openTokenSheet(borrow.underlying[0].asset)}
                  />
                ))}

                {(position.rewards.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.rewards)}
                  </Text>
                )}
                {position.rewards.map(reward => (
                  <SubPositionListItem
                    key={`claimable-${reward.asset.asset_code}-${reward.quantity}`}
                    asset={reward.asset}
                    quantity={reward.quantity}
                    native={reward.native}
                    positionColor={positionColor}
                    apy={undefined}
                    onPress={() => openTokenSheet(reward.asset)}
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
