import React from 'react';
import { Box, Inline, Stack, Text } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { useClaimables } from '@/resources/addys/claimables/query';
import { FasterImageView } from '@candlefinance/faster-image';
import { ButtonPressAnimation } from '@/components/animations';
import { deviceUtils } from '@/utils';
import Routes from '@/navigation/routesNames';
import { ExtendedState } from './core/RawRecyclerList';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplayWorklet, convertRawAmountToBalance } from '@/helpers/utilities';
import { analyticsV2 } from '@/analytics';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { useNativeAsset } from '@/utils/ethereumUtils';
import { ChainId } from '@/state/backendNetworks/types';
import { usePoints } from '@/resources/points';

const RAINBOW_ICON_URL = 'https://rainbowme-res.cloudinary.com/image/upload/v1694722625/dapps/rainbow-icon-large.png';

export const Claimable = React.memo(function Claimable({ uniqueId, extendedState }: { uniqueId: string; extendedState: ExtendedState }) {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { navigate } = extendedState;

  const isETHRewards = uniqueId === 'rainbow-eth-rewards';

  const eth = useNativeAsset({ chainId: ChainId.mainnet });

  const { data = [] } = useClaimables(
    {
      address: accountAddress,
      currency: nativeCurrency,
    },
    {
      select: data => data?.filter(claimable => claimable.uniqueId === uniqueId),
      enabled: !isETHRewards,
    }
  );

  const { data: points } = usePoints({
    walletAddress: accountAddress,
  });

  const [claimable] = data;
  const claimableETHRewardsRawAmount = points?.points?.user?.rewards?.claimable;

  if (isETHRewards) {
    if (!claimableETHRewardsRawAmount) return null;
  } else {
    if (!claimable) return null;
  }

  const { display: claimableETHRewardsDisplay, amount: claimableETHRewardsAmount } = isETHRewards
    ? convertRawAmountToBalance(claimableETHRewardsRawAmount ?? '0', {
        decimals: 18,
        symbol: 'ETH',
      })
    : { display: undefined, amount: undefined };

  const nativeDisplay = convertAmountToNativeDisplayWorklet(
    isETHRewards
      ? convertAmountAndPriceToNativeDisplay(claimableETHRewardsAmount ?? '0', eth?.price?.value || 0, nativeCurrency)?.amount
      : claimable?.value.nativeAsset.amount,
    nativeCurrency,
    true
  );

  if (isETHRewards) {
    if (!claimableETHRewardsDisplay) return null;
  }

  if (!nativeDisplay) return null;

  return (
    <Box
      as={ButtonPressAnimation}
      onPress={() => {
        if (!isETHRewards) {
          analyticsV2.track(analyticsV2.event.claimablePanelOpened, {
            claimableType: claimable?.type,
            claimableId: claimable?.analyticsId,
            chainId: claimable?.chainId,
            asset: { symbol: claimable?.asset.symbol, address: claimable?.asset.address },
            amount: claimable?.value.claimAsset.amount,
            usdValue: claimable?.value.usd,
          });
          navigate(Routes.CLAIM_CLAIMABLE_PANEL, { claimable });
        } else {
          navigate(Routes.CLAIM_REWARDS_PANEL);
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
            {isETHRewards ? 'Rainbow ETH Rewards' : claimable?.name}
          </Text>
          <Text weight="semibold" color="labelTertiary" size="13pt">
            {isETHRewards ? claimableETHRewardsDisplay : claimable?.value.claimAsset.display}
          </Text>
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
          {nativeDisplay}
        </Text>
      </Box>
    </Box>
  );
});
