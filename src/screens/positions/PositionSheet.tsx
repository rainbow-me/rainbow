import React, { useCallback } from 'react';
import { SlackSheet } from '@/components/sheet';
import { useDimensions } from '@/hooks';
import {
  BackgroundProvider,
  Box,
  Inline,
  Separator,
  Stack,
  Text,
} from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_ANDROID, IS_IOS } from '@/env';
import { Linking, StatusBar } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { analyticsV2 } from '@/analytics';
import { RainbowPosition } from '@/resources/defi/PositionsQuery';
import { RequestVendorLogoIcon } from '@/components/coin-icon';
import startCase from 'lodash/startCase';
import { useTheme } from '@/theme';
import { ButtonPressAnimation } from '@/components/animations';
import { SubPositionListItem } from './SubPositionListItem';
import { event } from '@/analytics/event';

const DEPOSIT_ITEM_HEIGHT = 44;
const BORROW_ITEM_HEIGHT = 44;
const CLAIMABLE_ITEM_HEIGHT = 44;
const ITEM_PADDING = 20;
const SECTION_TITLE_HEIGHT = 20 + ITEM_PADDING;

export function getPositionSheetHeight({
  position,
}: {
  position: RainbowPosition;
}) {
  console.log('inside: ', { position });
  let height = android ? 120 : 100;
  const numberOfDeposits = position?.deposits?.length || 0;
  const numberOfBorrows = position?.borrows?.length || 0;
  const numberOfClaimables = position?.claimables?.length || 0;
  console.log(position?.claimables[0]);

  height +=
    numberOfDeposits > 0
      ? SECTION_TITLE_HEIGHT +
        numberOfDeposits * (DEPOSIT_ITEM_HEIGHT + ITEM_PADDING)
      : 0;
  height +=
    numberOfBorrows > 0
      ? SECTION_TITLE_HEIGHT +
        numberOfBorrows * (BORROW_ITEM_HEIGHT + ITEM_PADDING)
      : 0;
  height +=
    numberOfClaimables > 0
      ? SECTION_TITLE_HEIGHT +
        numberOfClaimables * (CLAIMABLE_ITEM_HEIGHT + ITEM_PADDING)
      : 0;

  console.log({ numberOfBorrows, numberOfDeposits, numberOfClaimables });
  console.log('height for ', position?.type, ' is ', height);
  return height;
}

export const PositionSheet: React.FC = () => {
  const { params } = useRoute();
  const { colors } = useTheme();
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();

  const { position } = params as { position: RainbowPosition };

  const positionColor =
    position.dapp.colors.primary || position.dapp.colors.fallback;

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
        // @ts-expect-error JS component
        <SlackSheet
          backgroundColor={backgroundColor}
          additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
          {...(IS_IOS && { height: '100%' })}
          contentHeight={height - top - 100}
          scrollEnabled
        >
          <Box padding="20px" width="full">
            <Stack
              space="24px"
              separator={<Separator color="separatorTertiary" thickness={1} />}
            >
              <Inline alignHorizontal="justify" alignVertical="center">
                <Inline horizontalSpace={'10px'} alignVertical="center">
                  {/* @ts-ignore js component*/}
                  <RequestVendorLogoIcon
                    backgroundColor={positionColor}
                    dappName={startCase(position.type.split('-')[0])}
                    size={48}
                    imageUrl={position.dapp.icon_url}
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
                      height: 40,
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

              <Stack space={'20px'}>
                {(position?.deposits?.length || false) && (
                  <Text size="17pt" weight="heavy" color="label">
                    Deposits
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
                    Borrows
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
                    Rewards
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
