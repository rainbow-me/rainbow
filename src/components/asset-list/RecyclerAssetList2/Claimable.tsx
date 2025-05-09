import React, { memo, useMemo } from 'react';
import { Box, Inline, Stack, Text } from '@/design-system';
import { FasterImageView } from '@candlefinance/faster-image';
import { ButtonPressAnimation } from '@/components/animations';
import { deviceUtils } from '@/utils';
import Routes from '@/navigation/routesNames';
import { ExtendedState } from './core/RawRecyclerList';
import { analytics } from '@/analytics';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId } from '@/state/backendNetworks/types';
import { Claimable as ClaimableType } from '@/resources/addys/claimables/types';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getClaimableName, isRainbowEthRewards } from '@/resources/addys/claimables/utils';
import { Navigation } from '@/navigation';

const RAINBOW_ICON_URL = 'https://rainbowme-res.cloudinary.com/image/upload/v1694722625/dapps/rainbow-icon-large.png';
const avgCharWidth = 7;
const estimatedHorizontalPadding = 250;
const maxChars = Math.floor((DEVICE_WIDTH - estimatedHorizontalPadding) / avgCharWidth);

const NativeCurrencyDisplay = memo(function NativeCurrencyDisplay({ assets }: { assets: ClaimableType['assets'] }) {
  if (assets.length === 1) {
    const [{ amount }] = assets;
    return (
      <Text weight="semibold" color="labelTertiary" size="13pt" ellipsizeMode="tail" numberOfLines={1}>
        {amount.display}
      </Text>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { displayedSymbols, remaining } = useMemo(() => {
    const symbols = assets.map(a => a.asset.symbol);

    let charCount = 0;
    const displayedSymbols: string[] = [];
    for (const sym of symbols) {
      const sepLen = displayedSymbols.length > 0 ? 9 : 0; // for '|' separator + 4 gap on both side
      if (charCount + sepLen + sym.length <= maxChars) {
        charCount += sepLen + sym.length;
        displayedSymbols.push(sym);
      } else {
        break;
      }
    }
    return { displayedSymbols, remaining: symbols.length - displayedSymbols.length };
  }, [assets]);

  if (displayedSymbols.length === 0) {
    return (
      <Text weight="semibold" color="labelTertiary" size="13pt" ellipsizeMode="tail" numberOfLines={1}>
        {`${assets.length} Tokens`}
      </Text>
    );
  }

  return (
    <Box flexDirection="row" alignItems="center" gap={4}>
      {displayedSymbols.map((sym, idx) => (
        <React.Fragment key={`${sym}-${idx}`}>
          <Text weight="semibold" color="labelTertiary" size="13pt">
            {sym}
          </Text>
          {idx < displayedSymbols.length - 1 && (
            <Text weight="semibold" color={{ custom: 'rgba(26, 28, 31, 0.1)' }} size="13pt">
              |
            </Text>
          )}
        </React.Fragment>
      ))}
      {remaining > 0 && (
        <React.Fragment>
          <Text weight="semibold" color={{ custom: 'rgba(26, 28, 31, 0.1)' }} size="13pt">
            |
          </Text>
          <Text weight="semibold" color="labelTertiary" size="13pt">
            +{remaining}
          </Text>
        </React.Fragment>
      )}
    </Box>
  );
});

export const Claimable = React.memo(function Claimable({
  claimable,
  extendedState,
}: {
  claimable: ClaimableType;
  extendedState: ExtendedState;
}) {
  const isETHRewards = isRainbowEthRewards(claimable.uniqueId);

  return (
    <Box
      as={ButtonPressAnimation}
      onPress={() => {
        if (!isETHRewards) {
          analytics.track(analytics.event.claimablePanelOpened, {
            claimableType: claimable?.actionType,
            claimableId: claimable?.type,
            chainId: claimable?.chainId,
            assets: claimable?.assets.map(asset => ({
              symbol: asset.asset.symbol,
              address: asset.asset.address,
              amount: asset.amount.amount,
            })),
            usdValue: claimable?.totalCurrencyValue.amount,
          });
          Navigation.handleAction(Routes.CLAIM_CLAIMABLE_PANEL, { claimable });
        } else {
          Navigation.handleAction(Routes.CLAIM_REWARDS_PANEL);
        }
      }}
      scaleTo={0.96}
      paddingHorizontal="20px"
      justifyContent="space-between"
      alignItems="center"
      flexDirection="row"
    >
      <Inline alignVertical="center" space="12px">
        <Box borderRadius={11} borderWidth={1} borderColor={{ custom: 'rgba(0, 0, 0, 0.03)' }}>
          <FasterImageView source={{ url: isETHRewards ? RAINBOW_ICON_URL : claimable?.iconUrl }} style={{ height: 40, width: 40 }} />
        </Box>
        <ChainImage badgeXPosition={-10} chainId={isETHRewards ? ChainId.mainnet : claimable?.chainId} size={20} />
        <Stack space={{ custom: 11 }}>
          <Text
            weight="semibold"
            color="label"
            size="17pt"
            ellipsizeMode="tail"
            numberOfLines={1}
            style={{ maxWidth: deviceUtils.dimensions.width - 220 }}
          >
            {getClaimableName(claimable)}
          </Text>
          <NativeCurrencyDisplay assets={claimable.assets} />
        </Stack>
      </Inline>
      <Box
        alignItems="center"
        justifyContent="center"
        height={{ custom: 28 }}
        paddingHorizontal="8px"
        borderRadius={12}
        borderWidth={1.333}
        borderColor={{ custom: 'rgba(7, 17, 32, 0.02)' }}
        style={{ backgroundColor: 'rgba(7, 17, 32, 0.02)' }}
      >
        <Text weight="semibold" color="label" align="center" size="17pt">
          {claimable.totalCurrencyValue.display}
        </Text>
      </Box>
    </Box>
  );
});
