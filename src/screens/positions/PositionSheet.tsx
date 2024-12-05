import React, { useCallback } from 'react';
import { SlackSheet } from '@/components/sheet';
import { BackgroundProvider, Box, globalColors, Inline, Separator, Stack, Text, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { Linking } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { analyticsV2 } from '@/analytics';
import { RequestVendorLogoIcon } from '@/components/coin-icon';
import startCase from 'lodash/startCase';
import { useTheme } from '@/theme';
import { ButtonPressAnimation } from '@/components/animations';
import { SubPositionListItem } from './SubPositionListItem';
import { event } from '@/analytics/event';
import * as i18n from '@/languages';
import { capitalize } from 'lodash';
import { RainbowPosition } from '@/resources/defi/types';
import { LpPositionListItem } from './LpPositionListItem';
import { RootStackParamList } from '@/navigation/types';

const DEPOSIT_ITEM_HEIGHT = 44;
const BORROW_ITEM_HEIGHT = 44;
const CLAIMABLE_ITEM_HEIGHT = 44;
const STAKE_ITEM_HEIGHT = 44;
const ITEM_PADDING = 20;
const SECTION_TITLE_HEIGHT = 20 + ITEM_PADDING;

export function getPositionSheetHeight({ position }: { position: RainbowPosition }) {
  let height = IS_IOS ? 100 : 120;
  const numberOfDeposits = position.deposits.filter(deposit => !deposit.isLp).length || 0;
  const numberOfLpDeposits = position.deposits.filter(deposit => deposit.isLp).length || 0;
  const numberOfBorrows = position.borrows.length || 0;
  const numberOfClaimables = position.claimables.length || 0;
  const numberOfStakes = position.stakes.length || 0;

  height += numberOfDeposits > 0 ? SECTION_TITLE_HEIGHT + numberOfDeposits * (DEPOSIT_ITEM_HEIGHT + ITEM_PADDING) : 0;
  height += numberOfLpDeposits > 0 ? SECTION_TITLE_HEIGHT + numberOfLpDeposits * (DEPOSIT_ITEM_HEIGHT + ITEM_PADDING) : 0;
  height += numberOfBorrows > 0 ? SECTION_TITLE_HEIGHT + numberOfBorrows * (BORROW_ITEM_HEIGHT + ITEM_PADDING) : 0;
  height += numberOfClaimables > 0 ? SECTION_TITLE_HEIGHT + numberOfClaimables * (CLAIMABLE_ITEM_HEIGHT + ITEM_PADDING) : 0;
  height += numberOfStakes > 0 ? SECTION_TITLE_HEIGHT + numberOfStakes * (STAKE_ITEM_HEIGHT + ITEM_PADDING) : 0;

  return height;
}

export const PositionSheet: React.FC = () => {
  const {
    params: { position },
  } = useRoute<RouteProp<RootStackParamList, 'PositionSheet'>>();
  const { colors } = useTheme();
  const { isDarkMode } = useColorMode();

  const positionColor =
    position.dapp.colors.primary || position.dapp.colors.fallback || (isDarkMode ? globalColors.white100 : globalColors.white10);

  const deposits = position.deposits.filter(deposit => !deposit.isLp);
  const lpDeposits = position.deposits.filter(deposit => deposit.isLp);

  const openDapp = useCallback(() => {
    analyticsV2.track(event.positionsOpenedExternalDapp, {
      dapp: position.type,
      url: position.dapp.url,
    });
    Linking.openURL(position.dapp.url);
  }, [position.dapp.url, position.type]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SlackSheet
          backgroundColor={backgroundColor}
          {...(IS_IOS
            ? { height: '100%' }
            : {
                additionalTopPadding: true,
                contentHeight: getPositionSheetHeight({ position }),
              })}
          scrollEnabled
        >
          <Box padding="20px" width="full" paddingBottom={{ custom: 50 }}>
            <Stack space="24px" separator={<Separator color="separatorTertiary" thickness={1} />}>
              <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
                <Box style={{ maxWidth: '58%' }}>
                  <Inline horizontalSpace={'10px'} alignVertical="center" wrap={false}>
                    {/* @ts-ignore js component*/}
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
                {(deposits.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.deposits)}
                  </Text>
                )}
                {deposits.map(deposit => (
                  <SubPositionListItem
                    key={`deposit-${deposit.asset.asset_code}-${deposit.quantity}-${deposit.apy}`}
                    asset={deposit.underlying[0].asset}
                    quantity={deposit.underlying[0].quantity}
                    native={deposit.underlying[0].native}
                    dappVersion={deposit.dappVersion}
                    positionColor={positionColor}
                    apy={deposit.apy}
                  />
                ))}

                {(lpDeposits.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.pools)}
                  </Text>
                )}
                {lpDeposits.map(deposit => (
                  <LpPositionListItem
                    key={`deposit-${deposit.asset.asset_code}-${deposit.quantity}`}
                    assets={deposit.underlying}
                    totalAssetsValue={deposit.totalValue}
                    isConcentratedLiquidity={deposit.isConcentratedLiquidity}
                    dappVersion={deposit.dappVersion}
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
                    />
                  ) : (
                    <SubPositionListItem
                      key={`stake-${stake.asset.asset_code}-${stake.quantity}`}
                      asset={stake.underlying[0].asset}
                      quantity={stake.underlying[0].quantity}
                      native={stake.underlying[0].native}
                      positionColor={positionColor}
                      apy={stake.apy}
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
                  />
                ))}

                {(position.claimables.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.rewards)}
                  </Text>
                )}
                {position.claimables.map(claim => (
                  <SubPositionListItem
                    key={`claimable-${claim.asset.asset_code}-${claim.quantity}`}
                    asset={claim.asset}
                    quantity={claim.quantity}
                    native={claim.native}
                    positionColor={positionColor}
                    apy={undefined}
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
