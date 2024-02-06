import React from 'react';
import { Box } from '@/design-system';
import FastCoinIcon from '../asset-list/RecyclerAssetList2/FastComponents/FastCoinIcon';
import { ParsedAddressAsset } from '@/entities';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { ClipPath, Path } from 'react-native-svg';
import { useTheme } from '@/theme';

const Mask = () => (
  <Svg style={{ position: 'absolute', width: 0, height: 0 }}>
    <ClipPath id="underTokenClip">
      <Path d="M0.56,0 C0.251,0,0,0.251,0,0.56 C0,0.731,0.077,0.885,0.199,0.988 C0.237,1,0.29,0.983,0.29,0.933 V0.933 C0.29,0.578,0.578,0.29,0.933,0.29 V0.29 C0.983,0.29,1,0.237,0.988,0.199 C0.885,0.077,0.731,0,0.56,0" />
    </ClipPath>
  </Svg>
);
export function TwoCoinsIcon({
  size = 36,
  under,
  over,
  badge = true,
}: {
  size?: number;
  under: ParsedAddressAsset;
  over: ParsedAddressAsset;
  badge?: boolean;
}) {
  const theme = useTheme();
  const overSize = size * 0.75;
  const underSize = size * 0.67;

  const network = over.network;

  return (
    <Box style={{ minWidth: size, height: size }}>
      <MaskedView
        maskElement={<Mask />}
        style={{
          zIndex: 1,
          width: underSize * 0.924544,
          height: underSize * 0.924544,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <FastCoinIcon
          address={under?.address}
          network={under?.network}
          ignoreBadge={true}
          symbol={under.symbol}
          theme={theme}
        />
      </MaskedView>
      <Box
        //   borderColor="surfaceSecondary"
        borderRadius={100}
        style={{ zIndex: 2, position: 'absolute', bottom: 0, right: 0 }}
      >
        <FastCoinIcon
          address={over?.address}
          network={over?.network}
          ignoreBadge={true}
          symbol={under.symbol}
          theme={theme}
        />
      </Box>
      {/* <Box position="absolute" bottom="0" style={{ oitzIndex: 2, left: '-6px' }}>
          {badge && chainId !== ChainId.mainnet && (
            <ChainBadge chainId={chainId} shadow size="16" />
          )}
        </Box> */}
    </Box>
  );
}
