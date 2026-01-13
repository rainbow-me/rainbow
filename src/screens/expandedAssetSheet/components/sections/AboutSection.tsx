import React, { memo, useMemo } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Address } from 'viem';

import * as i18n from '@/languages';
import { Box } from '@/design-system/components/Box/Box';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { SheetSeparator } from '@/screens/expandedAssetSheet/components/shared/Separator';
import { SectionId, useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { AssetInfoItem } from '@/screens/expandedAssetSheet/components/sections/marketSection/AssetInfoList';
import { CreatorInfoRow } from './shared/CreatorInfoRow';

const LAYOUT_ANIMATION = FadeIn.duration(160);

type RowItem = {
  icon: string;
  iconName?: string;
  title: string;
  value: string;
};

export const AboutContent = memo(function AboutContent() {
  const { assetMetadata: metadata, accentColors } = useExpandedAssetSheetContext();
  const launchpad = metadata?.launchpad?.launchpad;
  const launchpadCreator = metadata?.launchpad?.creatorAddress as Address | undefined;

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

  return (
    <Box gap={40}>
      <Box gap={4} marginBottom={rowItems.length % 2 === 0 ? '-12px' : undefined}>
        {launchpadCreator && (
          <CreatorInfoRow address={launchpadCreator} icon="􀉭" label={i18n.t(i18n.l.expanded_state.sections.about.created_by)} />
        )}
        {rowItems.map((item, index) => (
          <AssetInfoItem
            key={item.title}
            accentColor={accentColors.color}
            title={item.title}
            value={item.value}
            icon={item.icon}
            valueIconUrl={item.iconName}
            // +1 due to creator row already highlighting
            highlighted={(index + 1) % 2 === 0}
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
  const { assetMetadata: metadata } = useExpandedAssetSheetContext();

  const { hasContent, isDeemphasized } = useMemo(() => {
    const hasCreator = !!metadata?.launchpad?.creatorAddress;
    const hasProtocol = !!metadata?.launchpad?.launchpad?.name;
    const hasPlatform = !!metadata?.launchpad?.launchpad?.platform;

    const hasContent = hasCreator || hasProtocol || hasPlatform;
    // De-emphasize if only creator exists (no protocol or platform)
    const isDeemphasized = hasCreator && !hasProtocol && !hasPlatform;

    return { hasContent, isDeemphasized };
  }, [metadata]);

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
