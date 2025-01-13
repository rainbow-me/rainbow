import React, { useMemo } from 'react';
import { Bleed, AnimatedText, Box, Stack, Text, TextIcon, TextShadow } from '@/design-system';
import { bigNumberFormat } from '@/helpers/bigNumberFormat';
import { Row } from '../../shared/Row';
import { greaterThanOrEqualTo } from '@/helpers/utilities';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';

const DEFAULT_VISIBLE_ITEMS = 2;

// eslint-disable-next-line react-hooks/exhaustive-deps
const assetInfo = {
  marketCap: 987620000,
  fullyDilutedValuation: 1350000000,
  rank: 3,
  circulatingSupply: 868471,
  maxSupply: 100000577,
};

function AssetInfoItem({ title, value, icon, highlighted }: { title: string; value: string; icon: string; highlighted: boolean }) {
  return (
    <Row highlighted={highlighted}>
      <Box width="full" flexDirection="row" alignItems="center" gap={8}>
        <TextIcon color="labelSecondary" size="15pt" weight="semibold">
          {icon}
        </TextIcon>
        <Text style={{ flex: 1 }} numberOfLines={1} ellipsizeMode="tail" color="labelSecondary" weight="medium" size="17pt">
          {title}
        </Text>
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text color="labelTertiary" weight="semibold" size="17pt">
            {value}
          </Text>
        </TextShadow>
      </Box>
    </Row>
  );
}

export function AssetInfoList() {
  const { accentColors } = useExpandedAssetSheetContext();
  const isExpanded = useSharedValue(false);

  const expandedText = useDerivedValue(() => {
    return isExpanded.value ? ('Less' as string) : ('More' as string);
  });

  const expandedTextIcon = useDerivedValue(() => {
    return isExpanded.value ? ('􀆇' as string) : ('􀆈' as string);
  });

  const expandedItemsContainerStyle = useAnimatedStyle(() => {
    return {
      display: isExpanded.value ? 'flex' : 'none',
      opacity: withSpring(isExpanded.value ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig),
    };
  });

  const assetInfoItems = useMemo(() => {
    const items: { title: string; value: string; icon: string }[] = [];

    if (assetInfo.marketCap) {
      items.push({
        title: 'Market Cap',
        value: bigNumberFormat(assetInfo.marketCap, 'USD', greaterThanOrEqualTo(assetInfo.marketCap, 1000000000)),
        icon: '􁎢',
      });
    }
    if (assetInfo.fullyDilutedValuation) {
      items.push({
        title: 'Fully Diluted Valuation',
        value: bigNumberFormat(assetInfo.fullyDilutedValuation, 'USD', greaterThanOrEqualTo(assetInfo.fullyDilutedValuation, 10000)),
        icon: '􀠏',
      });
    }
    if (assetInfo.rank) {
      items.push({
        title: 'Rank',
        value: '#' + assetInfo.rank.toString(),
        icon: '􀄯',
      });
    }
    if (assetInfo.circulatingSupply) {
      items.push({
        title: 'Circulating Supply',
        value: '0',
        icon: '􂣽',
      });
    }
    if (assetInfo.maxSupply) {
      items.push({
        title: 'Max Supply',
        value: '0',
        icon: '􀅃',
      });
    }

    return items;
  }, [assetInfo]);

  return (
    <Stack space="4px">
      {assetInfoItems.slice(0, DEFAULT_VISIBLE_ITEMS).map((item, index) => (
        <AssetInfoItem key={item.title} title={item.title} value={item.value} icon={item.icon} highlighted={index % 2 === 0} />
      ))}
      <Animated.View style={expandedItemsContainerStyle}>
        {assetInfoItems.slice(DEFAULT_VISIBLE_ITEMS).map((item, index) => (
          <AssetInfoItem key={item.title} title={item.title} value={item.value} icon={item.icon} highlighted={index % 2 !== 0} />
        ))}
      </Animated.View>
      <GestureHandlerButton
        scaleTo={0.96}
        hapticTrigger="tap-end"
        onPressWorklet={() => {
          'worklet';
          isExpanded.value = !isExpanded.value;
        }}
      >
        <Row highlighted={true}>
          <Bleed vertical="4px" horizontal="2px">
            <Box width="full" flexDirection="row" alignItems="center" gap={8}>
              <Box
                width={{ custom: 20 }}
                height={{ custom: 20 }}
                borderRadius={40}
                style={{ backgroundColor: accentColors.opacity6 }}
                borderWidth={1.33}
                borderColor={{ custom: accentColors.opacity2 }}
                alignItems="center"
                justifyContent="center"
              >
                <AnimatedText weight="black" align="center" size="icon 10px" color="labelQuaternary">
                  {expandedTextIcon}
                </AnimatedText>
              </Box>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <AnimatedText weight="semibold" size="17pt" align="center" color="labelTertiary">
                  {expandedText}
                </AnimatedText>
              </TextShadow>
            </Box>
          </Bleed>
        </Row>
      </GestureHandlerButton>
    </Stack>
  );
}
