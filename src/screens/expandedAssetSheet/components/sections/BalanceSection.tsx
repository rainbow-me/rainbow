import React, { useCallback } from 'react';
import * as i18n from '@/languages';
import { Box, Text, TextShadow } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { SheetSeparator } from '../shared/Separator';
import Animated from 'react-native-reanimated';
import { LAYOUT_ANIMATION } from '../shared/CollapsibleSection';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getBalance, TokenData } from '@/state/liveTokens/liveTokensStore';
import { useAccountSettings } from '@/hooks';
import { AnimatedNumber } from '@/components/animated-number/AnimatedNumber';
import { getSolidColorEquivalent } from '@/worklets/colors';

export function BalanceSection() {
  const { accentColors, accountAsset: asset, isOwnedAsset } = useExpandedAssetSheetContext();
  const { nativeCurrency } = useAccountSettings();
  const balanceAmount = asset?.balance?.amount ?? '0';

  const tokenBalanceSelector = useCallback(
    (token: TokenData) => {
      return getBalance({ token, balanceAmount, nativeCurrency });
    },
    [balanceAmount, nativeCurrency]
  );

  const liveTokenBalance = useLiveTokenValue({
    tokenId: asset?.uniqueId ?? '',
    initialValue: asset?.native?.balance?.display ?? '0',
    initialValueLastUpdated: asset?.price?.changed_at ?? 0,
    selector: tokenBalanceSelector,
  });

  if (!isOwnedAsset || !asset?.balance || !asset?.native?.balance) return null;

  // TODO: must do this for the `AnimatedNumber` masking to work properly. However, this means this card will be very slightly a different color than the other cards. It's generally imperceptible, but we should use this background color for all the cards
  const backgroundColor = getSolidColorEquivalent({ foreground: accentColors.color, background: accentColors.background, opacity: 0.06 });

  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <Box
        backgroundColor={accentColors.opacity6}
        borderColor={{ custom: accentColors.opacity6 }}
        borderRadius={20}
        borderWidth={1}
        gap={12}
        padding="16px"
      >
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="labelTertiary" size="15pt" weight="bold">
            {i18n.t(i18n.l.expanded_state.asset.balance)}
          </Text>
          <Text color="labelTertiary" size="15pt" weight="bold" align="right">
            {i18n.t(i18n.l.expanded_state.asset.value)}
          </Text>
        </Box>
        <Box alignItems="center" width="full" gap={8} flexDirection="row" justifyContent="flex-start">
          <RainbowCoinIcon
            size={20}
            chainId={asset.chainId}
            color={asset.color}
            icon={asset.icon_url}
            showBadge={false}
            symbol={asset.symbol}
          />
          <TextShadow blur={12} containerStyle={{ flex: 1 }} shadowOpacity={0.24}>
            <Text style={{ flex: 1 }} numberOfLines={1} ellipsizeMode="tail" weight="bold" size="20pt" color={'accent'}>
              {asset.balance.display}
            </Text>
          </TextShadow>
          <AnimatedNumber
            value={liveTokenBalance}
            easingMaskColor={backgroundColor}
            color="label"
            numberOfLines={1}
            size="20pt"
            weight="heavy"
            align="right"
            tabularNumbers
          />
        </Box>
      </Box>
      <SheetSeparator />
    </Box>
  );
}
