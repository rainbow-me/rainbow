import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import { Box, Text, TextIcon, TextShadow } from '@/design-system';
import { bigNumberFormat } from '@/helpers/bigNumberFormat';
import { Row } from '../../shared/Row';
import { abbreviateNumber } from '@/helpers/utilities';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { formatDate } from '@/utils/formatDate';
import { useAccountSettings } from '@/hooks';

const DEFAULT_VISIBLE_ITEM_COUNT = 3;

function AssetInfoItem({
  accentColor,
  title,
  value,
  icon,
  highlighted,
}: {
  accentColor: string;
  title: string;
  value: string;
  icon: string;
  highlighted: boolean;
}) {
  return (
    <Row highlighted={highlighted}>
      <Box width="full" flexDirection="row" alignItems="center" gap={12}>
        <TextIcon color="labelSecondary" size="15pt" weight="semibold">
          {icon}
        </TextIcon>
        <Text style={{ flex: 1 }} numberOfLines={1} ellipsizeMode="tail" color="labelSecondary" weight="medium" size="17pt">
          {title}
        </Text>
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text align="right" color={{ custom: accentColor }} weight="semibold" size="17pt">
            {value}
          </Text>
        </TextShadow>
      </Box>
    </Row>
  );
}

export function AssetInfoList() {
  const { nativeCurrency } = useAccountSettings();
  const { accentColors, assetMetadata: metadata, basicAsset: asset } = useExpandedAssetSheetContext();
  const isExpanded = useSharedValue(true);

  // TODO: Uncomment when market stats card is added back in

  // const moreText = i18n.t(i18n.l.button.more);
  // const lessText = i18n.t(i18n.l.button.less);

  // const expandedText = useDerivedValue(() => {
  //   return isExpanded.value ? lessText : moreText;
  // });

  // const expandedTextIcon = useDerivedValue(() => {
  //   return isExpanded.value ? ('􀆇' as string) : ('􀆈' as string);
  // });

  // END

  const expandedItemsContainerStyle = useAnimatedStyle(() => {
    return {
      display: isExpanded.value ? 'flex' : 'none',
      opacity: withSpring(isExpanded.value ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig),
      gap: 4,
    };
  });

  const assetInfoItems = useMemo(() => {
    const items: { title: string; value: string; icon: string }[] = [];

    if (!metadata) return items;

    if (metadata.marketCap) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.market_cap),
        value: bigNumberFormat(metadata.marketCap, nativeCurrency, true),
        icon: '􁎢',
      });
    }
    if (metadata.volume1d) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.volume_24_hours),
        value: bigNumberFormat(metadata.volume1d, nativeCurrency, true),
        icon: '􀣉',
      });
    }
    if (asset.creationDate) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.created),
        value: formatDate(asset.creationDate, 'minutes'),
        icon: '􁖩',
      });
    }
    if (metadata.fullyDilutedValuation) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.fully_diluted_valuation),
        value: bigNumberFormat(metadata.fullyDilutedValuation, nativeCurrency, true),
        icon: '􀑀',
      });
    }
    // BLOCKED: Do not currently have rank data
    // if (metadata.rank) {
    //   items.push({
    //     title: i18n.t(i18n.l.expanded_state.sections.market_stats.rank),
    //     value: `#${metadata.rank}`,
    //     icon: '􀄯',
    //   });
    // }
    if (metadata.circulatingSupply) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.circulating_supply),
        value: abbreviateNumber(metadata.circulatingSupply),
        icon: '􂣽',
      });
    }
    if (metadata.totalSupply) {
      items.push({
        title: i18n.t(i18n.l.expanded_state.sections.market_stats.max_supply),
        value: abbreviateNumber(metadata.totalSupply),
        icon: '􀅃',
      });
    }

    return items;
  }, [metadata, asset, nativeCurrency]);

  // TODO: Uncomment when market stats card is added back in
  // const isExpansionRowHighlighted = useDerivedValue(() => {
  //   return isExpanded.value ? assetInfoItems.length % 2 === 0 : DEFAULT_VISIBLE_ITEM_COUNT % 2 === 0;
  // });

  return (
    <Box gap={4} marginBottom={assetInfoItems.length % 2 === 0 ? '-12px' : undefined}>
      {assetInfoItems.length === 0 && (
        <Box justifyContent="center" alignItems="center" paddingTop="12px">
          <Text color="label" size="17pt" weight="medium">
            {i18n.t(i18n.l.expanded_state.asset.no_data_available)}
          </Text>
        </Box>
      )}
      {assetInfoItems.slice(0, DEFAULT_VISIBLE_ITEM_COUNT).map((item, index) => (
        <AssetInfoItem
          key={item.title}
          accentColor={accentColors.color}
          title={item.title}
          value={item.value}
          icon={item.icon}
          highlighted={index % 2 === 0}
        />
      ))}
      <Animated.View style={expandedItemsContainerStyle}>
        {assetInfoItems.slice(DEFAULT_VISIBLE_ITEM_COUNT).map(item => {
          const index = assetInfoItems.indexOf(item);
          return (
            <AssetInfoItem
              key={item.title}
              accentColor={accentColors.color}
              title={item.title}
              value={item.value}
              icon={item.icon}
              highlighted={index % 2 === 0}
            />
          );
        })}
      </Animated.View>
      {/* TODO: Uncomment when market stats card is added back in */}
      {/* {assetInfoItems.length > DEFAULT_VISIBLE_ITEM_COUNT && (
        <GestureHandlerButton
          scaleTo={0.96}
          hapticTrigger="tap-end"
          onPressWorklet={() => {
            'worklet';
            isExpanded.value = !isExpanded.value;
          }}
        >
          <Row highlighted={isExpansionRowHighlighted}>
            <Bleed vertical="4px" horizontal="2px">
              <Box width="full" flexDirection="row" alignItems="center" gap={12}>
                <Box
                  width={{ custom: 20 }}
                  height={{ custom: 20 }}
                  borderRadius={40}
                  style={{ backgroundColor: accentColors.border }}
                  borderWidth={1.33}
                  borderColor={{ custom: accentColors.opacity4 }}
                  alignItems="center"
                  justifyContent="center"
                >
                  <AnimatedText weight="black" align="center" size="icon 10px" color={{ custom: accentColors.color }}>
                    {expandedTextIcon}
                  </AnimatedText>
                </Box>
                <TextShadow blur={12} shadowOpacity={0.24}>
                  <AnimatedText weight="semibold" size="17pt" align="center" color={{ custom: accentColors.color }}>
                    {expandedText}
                  </AnimatedText>
                </TextShadow>
              </Box>
            </Bleed>
          </Row>
        </GestureHandlerButton>
      )} */}
    </Box>
  );
}
