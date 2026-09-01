import React, { memo, useCallback, useMemo } from 'react';

import { LinearGradient } from 'expo-linear-gradient';

import { type ParsedSearchAsset } from '@/__swaps__/types/assets';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Column, Columns, Inline, Stack, Text, useForegroundColor } from '@/design-system';
import { CashBalanceIcon } from '@/features/cash-balance/components/CashBalanceIcon';
import { CASH_BALANCE_COLORS } from '@/features/cash-balance/constants';
import { useCashBalance } from '@/features/cash-balance/hooks/useCashBalance';
import { useCashBalanceAddPress } from '@/features/cash-balance/hooks/useCashBalanceAddPress';
import { ChainId } from '@/features/network/types/backendNetworks';
import { useNavigateToSend } from '@/features/transfer/hooks/useNavigateToSend';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { USDC_ADDRESS } from '@/references/constants';
import { parsedSearchAssetToParsedAddressAsset } from '@/state/assets/utils';
import getUrlForTrustIconFallback from '@/utils/getUrlForTrustIconFallback';

// Matches the arrow used by the send button elsewhere (wallet screen / expanded asset sheet)
const SEND_ICON = '􀈟';
const BUTTON_HEIGHT = 48;
// Shown when there's no held Base USDC asset to source an icon from — same fallback pattern
// used by the perps and Add Cash USDC icons.
const USDC_ICON_URL = getUrlForTrustIconFallback(USDC_ADDRESS, ChainId.mainnet) ?? undefined;

function CashBalanceHalfSheetHeader() {
  return (
    <Inline alignVertical="center" horizontalSpace="12px" wrap={false}>
      <CashBalanceIcon />
      <Text color="label" size="22pt" weight="heavy">
        {i18n.t(i18n.l.cash_balance.half_sheet.title)}
      </Text>
    </Inline>
  );
}

function CashBalanceSubLabelIcon({ asset, size }: { asset: ParsedSearchAsset | undefined; size: number }) {
  return (
    <RainbowCoinIcon
      chainId={ChainId.base}
      color={asset?.colors?.primary}
      icon={asset?.icon_url ?? USDC_ICON_URL}
      showBadge={false}
      size={size}
      symbol={asset?.symbol ?? 'USDC'}
    />
  );
}

// Shown once there's a Base USDC balance to describe: a floating pill, matching the Figma
// "has balance" half sheet.
function CashBalanceBadge({ asset }: { asset: ParsedSearchAsset | undefined }) {
  return (
    <Box
      alignItems="center"
      background="surfaceSecondaryElevated"
      borderRadius={20}
      flexDirection="row"
      gap={6}
      height={{ custom: 40 }}
      paddingLeft="10px"
      paddingRight="12px"
      shadow="12px"
    >
      <CashBalanceSubLabelIcon asset={asset} size={20} />
      <Text color="labelTertiary" size="15pt" weight="bold">
        {i18n.t(i18n.l.cash_balance.half_sheet.subtitle)}
      </Text>
    </Box>
  );
}

// Shown before there's any Base USDC balance, matching the Figma "Add only" half sheet: a plain
// caption under a hairline divider instead of the floating pill.
function CashBalanceSubLabel({ asset }: { asset: ParsedSearchAsset | undefined }) {
  const separatorColor = useForegroundColor('separatorSecondary');

  return (
    <Stack alignHorizontal="center" space="16px">
      <Box backgroundColor={separatorColor} height={{ custom: 1 }} width="full" />
      <Inline alignVertical="center" horizontalSpace="6px" wrap={false}>
        <CashBalanceSubLabelIcon asset={asset} size={16} />
        <Text color="labelQuaternary" size="15pt" weight="semibold">
          {i18n.t(i18n.l.cash_balance.half_sheet.subtitle)}
        </Text>
      </Inline>
    </Stack>
  );
}

function CashBalanceActionButton({
  children,
  circular,
  onPress,
  testID,
}: {
  children: React.ReactNode;
  circular?: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.94} testID={testID}>
      <Box
        as={LinearGradient}
        alignItems="center"
        background="green"
        borderRadius={BUTTON_HEIGHT / 2}
        colors={CASH_BALANCE_COLORS.addButtonGradient}
        end={{ x: 0.75, y: 1 }}
        height={{ custom: BUTTON_HEIGHT }}
        justifyContent="center"
        shadow="12px green"
        start={{ x: 0, y: 0 }}
        width={circular ? { custom: BUTTON_HEIGHT } : 'full'}
      >
        {children}
      </Box>
    </ButtonPressAnimation>
  );
}

export const CashBalanceHalfSheet = memo(function CashBalanceHalfSheet() {
  const { asset, balanceDisplay, hasBalance } = useCashBalance();
  const { navigate } = useNavigation();
  const handleAddPress = useCashBalanceAddPress('cash balance half sheet');

  // A real route stacked on top, not an inline overlay, so it gets its own independent native
  // dismiss gesture instead of dragging this half sheet along with it.
  const handleWithdrawPress = useCallback(() => {
    navigate(Routes.CASH_BALANCE_WITHDRAW_COMING_SOON_SHEET);
  }, [navigate]);

  const sendAsset = useMemo(() => (asset ? parsedSearchAssetToParsedAddressAsset(asset) : undefined), [asset]);
  const handleSendPress = useNavigateToSend(sendAsset);

  return (
    <PanelSheet>
      <Box paddingBottom="20px" paddingHorizontal="20px" paddingTop="20px">
        <CashBalanceHalfSheetHeader />

        <Box paddingTop={{ custom: 64 }}>
          <Text align="center" color="label" size="44pt" weight="heavy">
            {balanceDisplay}
          </Text>
        </Box>

        <Box alignItems={hasBalance ? 'center' : undefined} paddingTop={{ custom: hasBalance ? 52 : 64 }}>
          {hasBalance ? <CashBalanceBadge asset={asset} /> : <CashBalanceSubLabel asset={asset} />}
        </Box>

        <Box paddingTop={{ custom: hasBalance ? 20 : 16 }}>
          <Columns space="8px">
            <CashBalanceActionButton onPress={handleAddPress} testID="cash-balance-half-sheet-add-button">
              <Text color="white" size="20pt" weight="heavy">
                {i18n.t(i18n.l.button.add)}
              </Text>
            </CashBalanceActionButton>
            {hasBalance && (
              <CashBalanceActionButton onPress={handleWithdrawPress} testID="cash-balance-half-sheet-withdraw-button">
                <Text color="white" size="20pt" weight="heavy">
                  {i18n.t(i18n.l.button.withdraw)}
                </Text>
              </CashBalanceActionButton>
            )}
            {hasBalance && asset && (
              <Column width="content">
                <CashBalanceActionButton circular onPress={handleSendPress} testID="cash-balance-half-sheet-send-button">
                  <Text color="white" size="icon 20px" weight="heavy">
                    {SEND_ICON}
                  </Text>
                </CashBalanceActionButton>
              </Column>
            )}
          </Columns>
        </Box>
      </Box>
    </PanelSheet>
  );
});
