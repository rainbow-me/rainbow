import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';
import { AnimatedText } from '@/design-system/components/Text/AnimatedText';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { ItemSelector, Item, RenderItemProps } from './ItemSelector';
import { BET_TYPE, BetType } from './utils/getMarketsGroupedByBetType';

// ============ Constants ====================================================== //

const PILL_HEIGHT = 64;
const PILL_GAP = 8;

const BET_TYPE_ORDER: BetType[] = [BET_TYPE.MONEYLINE, BET_TYPE.SPREADS, BET_TYPE.TOTALS, BET_TYPE.OTHER];

const BET_TYPE_CONFIG: Record<BetType, { labelKey: string; icon: string }> = {
  [BET_TYPE.MONEYLINE]: { labelKey: i18n.l.predictions.bet_types.winner, icon: '􀢊' },
  [BET_TYPE.SPREADS]: { labelKey: i18n.l.predictions.bet_types.spreads, icon: '􀄭' },
  [BET_TYPE.TOTALS]: { labelKey: i18n.l.predictions.bet_types.totals, icon: '􂝔' },
  [BET_TYPE.OTHER]: { labelKey: i18n.l.predictions.bet_types.other, icon: '􀬎' },
};

// ============ Types ========================================================== //

type BetTypeSelectorProps = {
  availableBetTypes: BetType[];
  backgroundColor: string;
  color: string;
  containerWidth: number;
  onSelectBetType: (betType: BetType) => void;
  selectedBetType: BetType;
};

// ============ Main Component ================================================= //

export const BetTypeSelector = memo(function BetTypeSelector({
  availableBetTypes,
  backgroundColor,
  color,
  containerWidth,
  onSelectBetType,
  selectedBetType,
}: BetTypeSelectorProps) {
  const items: Item[] = useMemo(
    () =>
      BET_TYPE_ORDER.filter(type => availableBetTypes.includes(type)).map(type => ({
        value: type,
        label: i18n.t(BET_TYPE_CONFIG[type].labelKey),
      })),
    [availableBetTypes]
  );

  const handleSelect = useCallback(
    (value: string) => {
      onSelectBetType(value as BetType);
    },
    [onSelectBetType]
  );

  const renderItem = useCallback(
    ({ accentColor, index, item, selectedIndex }: RenderItemProps) => (
      <BetTypeItemContent
        accentColor={accentColor}
        icon={BET_TYPE_CONFIG[item.value as BetType].icon}
        index={index}
        item={item}
        selectedIndex={selectedIndex}
      />
    ),
    []
  );

  return (
    <ItemSelector
      accentColor={color}
      backgroundColor={backgroundColor}
      containerWidth={containerWidth}
      containerBorderRadius={24}
      highlightBorderRadius={24}
      items={items}
      onSelect={handleSelect}
      paddingHorizontal={0}
      pillGap={PILL_GAP}
      pillHeight={PILL_HEIGHT}
      renderItem={renderItem}
      selectedValue={selectedBetType}
      showBorder={false}
    />
  );
});

// ============ BetTypeItemContent ============================================= //

const BetTypeItemContent = memo(function BetTypeItemContent({
  accentColor,
  index,
  item,
  selectedIndex,
  icon,
}: Pick<RenderItemProps, 'accentColor' | 'index' | 'item' | 'selectedIndex'> & { icon: string }) {
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const textStyle = useAnimatedStyle(() => {
    const isSelected = selectedIndex.value === index;
    const textColor = isSelected ? accentColor : labelQuaternary;
    if (!IS_IOS) return { color: textColor };
    return {
      color: textColor,
      fontWeight: isSelected ? '800' : '700',
    };
  });

  return (
    <View style={styles.itemContent}>
      <AnimatedText align="center" color="labelQuaternary" size="15pt" style={textStyle} weight="bold">
        {icon}
      </AnimatedText>
      <AnimatedText align="center" color="labelQuaternary" size="15pt" style={textStyle} weight="bold">
        {item.label}
      </AnimatedText>
    </View>
  );
});

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  itemContent: {
    alignItems: 'center',
    gap: 10,
  },
});
