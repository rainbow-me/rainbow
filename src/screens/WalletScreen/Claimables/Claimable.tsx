import React from 'react';
import { Box, Inline, Stack, Text } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { FasterImageView } from '@candlefinance/faster-image';
import { ButtonPressAnimation } from '@/components/animations';
import { deviceUtils } from '@/utils';
import Routes from '@/navigation/routesNames';
import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import { analyticsV2 } from '@/analytics';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId } from '@/state/backendNetworks/types';
import { Claimable as ClaimableType } from '@/resources/addys/claimables/types';
import { useNavigation } from '@/navigation';

const RAINBOW_ICON_URL = 'https://rainbowme-res.cloudinary.com/image/upload/v1694722625/dapps/rainbow-icon-large.png';

export const ClaimableHeight = 40;

export function Claimable({ uniqueId, claimable }: { uniqueId: string; claimable: ClaimableType }) {
  const { nativeCurrency } = useAccountSettings();
  const { navigate } = useNavigation();
  const isETHRewards = uniqueId === 'rainbow-eth-rewards';

  const nativeDisplay = convertAmountToNativeDisplayWorklet(claimable?.value.nativeAsset.amount, nativeCurrency, true);

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
            {isETHRewards ? nativeDisplay : claimable?.value.claimAsset.display}
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
}
