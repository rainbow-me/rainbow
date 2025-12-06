import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';
import { AnimatedText, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { ItemSelector, Item, RenderItemProps } from './ItemSelector';
import { BET_TYPE, BetType } from './utils/getMarketsGroupedByBetType';

// ============ Constants ====================================================== //

const PILL_HEIGHT = 64;
const PILL_GAP = 8;

const BET_TYPE_ORDER: BetType[] = [BET_TYPE.MONEYLINE, BET_TYPE.SPREADS, BET_TYPE.TOTALS, BET_TYPE.OTHER];

const BET_TYPE_CONFIG: Record<BetType, { label: string; icon: string }> = {
  [BET_TYPE.MONEYLINE]: { label: 'Winner', icon: '􀢊' },
  [BET_TYPE.SPREADS]: { label: 'Spreads', icon: '􀄭' },
  [BET_TYPE.TOTALS]: { label: 'Totals', icon: '􂝔' },
  [BET_TYPE.OTHER]: { label: 'Other', icon: '􀬎' },
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
        label: BET_TYPE_CONFIG[type].label,
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
