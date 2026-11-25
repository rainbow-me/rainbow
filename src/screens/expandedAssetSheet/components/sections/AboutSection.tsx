import React, { memo, useCallback, useMemo } from 'react';

import FastImage from 'react-native-fast-image';
import Animated, { FadeIn } from 'react-native-reanimated';
import { type Address } from 'viem';

import { Box } from '@/design-system';
import { ChainImage } from '@/features/network/components/ChainImage';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { AssetInfoItem } from '@/screens/expandedAssetSheet/components/sections/marketSection/AssetInfoList';
import { SheetSeparator } from '@/screens/expandedAssetSheet/components/shared/Separator';
import { type AboutRowIcon, type InfoTextPart } from '@/screens/expandedAssetSheet/utils/assetClassification';

import { SectionId, useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { CreatorInfoRow } from './shared/CreatorInfoRow';

const LAYOUT_ANIMATION = FadeIn.duration(160);

type RowItem = {
  icon: string;
  iconName?: string;
  title: string;
  value: string;
};

const RoundedSquareIcon = memo(function RoundedSquareIcon({ url }: { url: string }) {
  return <FastImage source={{ uri: url }} style={{ width: 16, height: 16, borderRadius: 4 }} />;
});

function renderValueIcon(icon: AboutRowIcon | undefined) {
  if (!icon) return undefined;
  if (icon.type === 'chain') return <ChainImage chainId={icon.chainId} position="relative" size={16} />;
  return <RoundedSquareIcon url={icon.url} />;
}

export const AboutContent = memo(function AboutContent() {
  const { assetMetadata: metadata, assetClassification, accentColors, basicAsset } = useExpandedAssetSheetContext();
  const launchpad = metadata?.launchpad?.launchpad;
  const launchpadCreator = metadata?.launchpad?.creatorAddress as Address | undefined;
  const classificationRows = assetClassification?.rows ?? [];
  const offset = classificationRows.length;

  const rowItems = useMemo(() => {
    const items: RowItem[] = [];

    if (launchpad?.name) {
      items.push({
        icon: '􀐞',
        title: i18n.t(i18n.l.expanded_state.sections.about.protocol),
        value: launchpad.name,
        iconName: launchpad.protocolIconURL,
      });
    }

    if (launchpad?.platform) {
      items.push({
        icon: '􁝸',
        title: i18n.t(i18n.l.expanded_state.sections.about.created_via),
        value: launchpad.platform,
        iconName: launchpad.platformIconURL,
      });
    }

    return items;
  }, [launchpad?.name, launchpad?.platform, launchpad?.platformIconURL, launchpad?.protocolIconURL]);

  const infoText = assetClassification?.infoText;
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

  // Without classification rows, launchpad rows keep their original striping, which reserves the creator slot even when it's empty
  const launchpadStart = offset + (launchpadCreator || offset === 0 ? 1 : 0);
  const isLaunchpadRowHighlighted = (index: number) => (launchpadStart + index) % 2 === 0;
  // The last row's highlight decides whether the list overlaps the section's bottom spacing
  const isLastRowHighlighted = isLaunchpadRowHighlighted(rowItems.length - 1);

  return (
    <Box gap={40}>
      <Box gap={4} marginBottom={isLastRowHighlighted ? '-12px' : undefined}>
        {classificationRows.map((row, index) => (
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
                    accessibilityLabel: i18n.t(i18n.l.expanded_state.sections.about.about_asset_type, { assetType: row.value }),
                  }
                : undefined
            }
            highlighted={index % 2 === 0}
            truncateValue
          />
        ))}
        {launchpadCreator && (
          <CreatorInfoRow
            address={launchpadCreator}
            highlighted={offset % 2 === 0}
            icon="􀉭"
            label={i18n.t(i18n.l.expanded_state.sections.about.created_by)}
          />
        )}
        {rowItems.map((item, index) => (
          <AssetInfoItem
            key={item.title}
            accentColor={accentColors.color}
            title={item.title}
            value={item.value}
            icon={item.icon}
            valueIcon={
              item.iconName ? <FastImage source={{ uri: item.iconName }} style={{ width: 16, height: 16, borderRadius: 8 }} /> : undefined
            }
            highlighted={isLaunchpadRowHighlighted(index)}
          />
        ))}
      </Box>
    </Box>
  );
});

const shouldShowAboutSection = (placement: Placement, hasContent: boolean, isDeemphasized: boolean) => {
  if (!hasContent) {
    return false;
  }
  return (placement === Placement.AFTER_CLAIM && !isDeemphasized) || (placement === Placement.AFTER_HISTORY && isDeemphasized);
};

export enum Placement {
  AFTER_CLAIM = 'after_claim',
  AFTER_HISTORY = 'after_history',
}

type AboutSectionProps = {
  placement: Placement;
};

export const AboutSection = memo(function AboutSection({ placement }: AboutSectionProps) {
  const { assetMetadata: metadata, assetClassification } = useExpandedAssetSheetContext();

  const { hasContent, isDeemphasized } = useMemo(() => {
    const hasCreator = !!metadata?.launchpad?.creatorAddress;
    const hasProtocol = !!metadata?.launchpad?.launchpad?.name;
    const hasPlatform = !!metadata?.launchpad?.launchpad?.platform;
    const hasClassification = !!assetClassification;

    const hasContent = hasClassification || hasCreator || hasProtocol || hasPlatform;
    // De-emphasize if only creator exists (no protocol, platform or classification)
    const isDeemphasized = hasCreator && !hasProtocol && !hasPlatform && !hasClassification;

    return { hasContent, isDeemphasized };
  }, [metadata, assetClassification]);

  if (!shouldShowAboutSection(placement, hasContent, isDeemphasized)) return null;

  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <CollapsibleSection
        content={<AboutContent />}
        icon="􀅴"
        id={SectionId.ABOUT}
        primaryText={i18n.t(i18n.l.expanded_state.sections.about.title)}
      />
      <SheetSeparator />
    </Box>
  );
});
