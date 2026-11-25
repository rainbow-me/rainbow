import React from 'react';

import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Text, TextShadow } from '@/design-system';
import { useRoute } from '@/navigation/RouteContext';
import type Routes from '@/navigation/routesNames';

export function AssetTypeInfoSheet() {
  const {
    params: { accentColor, chainId, iconUrl, infoText, symbol, title, tokenName },
  } = useRoute<typeof Routes.ASSET_TYPE_INFO_SHEET>();

  return (
    <PanelSheet borderRadius={38} innerBorderWidth={1}>
      <Box gap={24} paddingHorizontal={{ custom: 32 }} paddingTop={{ custom: 36 }} paddingBottom={{ custom: 40 }}>
        <RainbowCoinIcon chainId={chainId} color={accentColor} icon={iconUrl} showBadge={false} size={56} symbol={symbol} />
        <Box gap={12}>
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text color={{ custom: accentColor }} size="20pt" weight="heavy">
              {tokenName}
            </Text>
          </TextShadow>
          <Text color="label" size="26pt" weight="heavy">
            {title}
          </Text>
        </Box>
        <Text color="labelTertiary" size="17pt / 135%" weight="semibold">
          {infoText.map((part, index) =>
            part.emphasized ? (
              <Text key={index} color="labelSecondary" size="17pt / 135%" weight="bold">
                {part.text}
              </Text>
            ) : (
              part.text
            )
          )}
        </Text>
      </Box>
    </PanelSheet>
  );
}
