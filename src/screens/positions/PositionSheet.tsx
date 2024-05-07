import React, { useCallback } from 'react';
import { SlackSheet } from '@/components/sheet';
import { BackgroundProvider, Box, Inline, Separator, Stack, Text } from '@/design-system';
import { IS_IOS } from '@/env';
import { Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
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

const DEPOSIT_ITEM_HEIGHT = 44;
const BORROW_ITEM_HEIGHT = 44;
const CLAIMABLE_ITEM_HEIGHT = 44;
const ITEM_PADDING = 20;
const SECTION_TITLE_HEIGHT = 20 + ITEM_PADDING;

export function getPositionSheetHeight({ position }: { position: RainbowPosition }) {
  let height = android ? 120 : 100;
  const numberOfDeposits = position?.deposits?.length || 0;
  const numberOfBorrows = position?.borrows?.length || 0;
  const numberOfClaimables = position?.claimables?.length || 0;

  height += numberOfDeposits > 0 ? SECTION_TITLE_HEIGHT + numberOfDeposits * (DEPOSIT_ITEM_HEIGHT + ITEM_PADDING) : 0;
  height += numberOfBorrows > 0 ? SECTION_TITLE_HEIGHT + numberOfBorrows * (BORROW_ITEM_HEIGHT + ITEM_PADDING) : 0;
  height += numberOfClaimables > 0 ? SECTION_TITLE_HEIGHT + numberOfClaimables * (CLAIMABLE_ITEM_HEIGHT + ITEM_PADDING) : 0;

  return height;
}

export const PositionSheet: React.FC = () => {
  const { params } = useRoute();
  const { colors } = useTheme();

  const { position } = params as { position: RainbowPosition };

  const positionColor = position.dapp.colors.primary || position.dapp.colors.fallback;

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
              </Inline>

              <Stack space={'20px'}>
                {(position?.deposits?.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.deposits)}
                  </Text>
                )}
                {position?.deposits?.map(deposit => (
                  <SubPositionListItem
                    key={`deposit-${deposit.underlying[0].asset.asset_code}-${deposit.quantity}-${deposit.apy}`}
                    asset={deposit.underlying[0].asset}
                    quantity={deposit.underlying[0].quantity}
                    native={deposit.underlying[0].native}
                    positionColor={positionColor}
                    apy={deposit.apy}
                  />
                ))}

                {(position?.borrows?.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.borrows)}
                  </Text>
                )}
                {position?.borrows?.map(borrow => (
                  <SubPositionListItem
                    key={`borrow-${borrow.underlying[0].asset.asset_code}-${borrow.quantity}-${borrow.apy}`}
                    asset={borrow.underlying[0].asset}
                    quantity={borrow.underlying[0].quantity}
                    native={borrow.underlying[0].native}
                    positionColor={positionColor}
                    apy={borrow.apy}
                  />
                ))}

                {(position?.claimables?.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    {i18n.t(i18n.l.positions.rewards)}
                  </Text>
                )}
                {position?.claimables?.map(claim => (
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
