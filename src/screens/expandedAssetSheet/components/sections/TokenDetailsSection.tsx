import React, { memo, useCallback, type ReactNode } from 'react';

import FastImage from 'react-native-fast-image';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Box } from '@/design-system';
import { ChainImage } from '@/features/network/components/ChainImage';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { AssetInfoItem } from '@/screens/expandedAssetSheet/components/sections/marketSection/AssetInfoList';
import { SheetSeparator } from '@/screens/expandedAssetSheet/components/shared/Separator';
import {
  type AssetClassification,
  type InfoTextPart,
  type TokenDetailsRowIcon,
} from '@/screens/expandedAssetSheet/utils/assetClassification';

import { SectionId, useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { CollapsibleSection } from '../shared/CollapsibleSection';

const LAYOUT_ANIMATION = FadeIn.duration(160);

function ImageIcon({ url, borderRadius }: { url: string; borderRadius: number }) {
  return <FastImage source={{ uri: url }} style={{ width: 16, height: 16, borderRadius }} />;
}

function renderValueIcon(icon: TokenDetailsRowIcon | undefined) {
  if (!icon) return undefined;
  if (icon.type === 'chain') return <ChainImage chainId={icon.chainId} position="relative" size={16} />;
  return <ImageIcon url={icon.url} borderRadius={4} />;
}

type LaunchpadRow = { key: string; title: string; value: string; icon: string; valueIcon: ReactNode };

function launchpadIcon(url: string | null | undefined) {
  return url ? <ImageIcon url={url} borderRadius={8} /> : undefined;
}

const TokenDetailsContent = memo(function TokenDetailsContent({ classification }: { classification: AssetClassification }) {
  const { accentColors, assetMetadata, basicAsset } = useExpandedAssetSheetContext();
  const { rows, infoText } = classification;
  const launchpad = assetMetadata?.launchpad?.launchpad;
  const launchpadRows = (
    [
      launchpad?.name
        ? {
            key: 'protocol',
            title: i18n.t(i18n.l.expanded_state.sections.about.protocol),
            value: launchpad.name,
            icon: '􀐞',
            valueIcon: launchpadIcon(launchpad.protocolIconURL),
          }
        : undefined,
      launchpad?.platform
        ? {
            key: 'created_via',
            title: i18n.t(i18n.l.expanded_state.sections.about.created_via),
            value: launchpad.platform,
            icon: '􁝸',
            valueIcon: launchpadIcon(launchpad.platformIconURL),
          }
        : undefined,
    ] satisfies (LaunchpadRow | undefined)[]
  ).filter(row => !!row);
  const rowCount = rows.length + launchpadRows.length;

  const openAssetTypeInfo = useCallback(
    (title: string, infoText: InfoTextPart[]) =>
      Navigation.handleAction(Routes.ASSET_TYPE_INFO_SHEET, {
        title,
        infoText,
        tokenName: basicAsset.name,
        iconUrl: basicAsset.iconUrl ?? undefined,
        symbol: basicAsset.symbol,
        chainId: basicAsset.chainId,
        accentColor: accentColors.color,
      }),
    [accentColors.color, basicAsset.chainId, basicAsset.iconUrl, basicAsset.name, basicAsset.symbol]
  );

  return (
    <Box gap={4} marginBottom={rowCount % 2 === 1 ? '-12px' : undefined}>
      {rows.map((row, index) => (
        <AssetInfoItem
          key={row.key}
          accentColor={accentColors.color}
          title={row.title}
          value={row.value}
          icon={row.icon}
          valueIcon={renderValueIcon(row.valueIcon)}
          info={
            row.key === 'asset_type' && infoText
              ? {
                  onPress: () => openAssetTypeInfo(row.value, infoText),
                  accessibilityLabel: i18n.t(i18n.l.expanded_state.sections.token_details.about_asset_type, { assetType: row.value }),
                }
              : undefined
          }
          highlighted={index % 2 === 0}
          truncateValue
        />
      ))}
      {launchpadRows.map((row, index) => (
        <AssetInfoItem
          key={row.key}
          accentColor={accentColors.color}
          title={row.title}
          value={row.value}
          icon={row.icon}
          valueIcon={row.valueIcon}
          highlighted={(rows.length + index) % 2 === 0}
          truncateValue
        />
      ))}
    </Box>
  );
});

export const TokenDetailsSection = memo(function TokenDetailsSection() {
  const { assetClassification } = useExpandedAssetSheetContext();

  if (!assetClassification) return null;

  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <CollapsibleSection
        content={<TokenDetailsContent classification={assetClassification} />}
        icon="􁜾"
        id={SectionId.TOKEN_DETAILS}
        primaryText={i18n.t(i18n.l.expanded_state.sections.token_details.title)}
      />
      <SheetSeparator />
    </Box>
  );
});
