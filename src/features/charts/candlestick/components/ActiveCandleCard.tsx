import React, { ComponentType, ReactElement, ReactNode, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useDerivedValue, useAnimatedStyle, withSpring, withTiming, DerivedValue } from 'react-native-reanimated';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, AnimatedTextProps, Box, BoxProps, Text, TextProps, TextShadow, useColorMode } from '@/design-system';
import { foregroundColors, globalColors } from '@/design-system/color/palettes';
import { NativeCurrencyKey } from '@/entities';
import { IS_IOS } from '@/env';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { abbreviateNumberWorklet } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { SupportedCurrencyKey, supportedNativeCurrencies } from '@/references';
import { addCommasToNumber, opacityWorklet } from '@/__swaps__/utils/swaps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { FormatTimestampOptions, formatTimestamp } from '@/worklets/dates';
import { Bar } from '../types';

// ============ Types ========================================================== //

enum Field {
  Close = 'c',
  High = 'h',
  Low = 'l',
  Open = 'o',
  Time = 't',
  Volume = 'v',
}

enum BadgeTheme {
  Accent = 'accent',
  Green = 'green',
  Neutral = 'neutral',
  Red = 'red',
}

// ============ Constants ====================================================== //

const BADGE = Object.freeze({ borderRadius: 8.5, borderWidth: 5 / 3, paddingHorizontal: 7 });
const BADGE_BORDER_OPACITY = Object.freeze({ dark: 0.12, light: 0.12 });
const ROW_HEIGHT = 20;
const TIME_FORMAT_OPTIONS: FormatTimestampOptions = Object.freeze({ case: 'uppercase', useTodayYesterday: true });

// ============ ActiveCandleCard =============================================== //

export const ActiveCandleCard = memo(function ActiveCandleCard({
  accentColor,
  activeCandle,
  backgroundColor,
  currency,
}: {
  accentColor: string;
  activeCandle: SharedValue<Bar | undefined>;
  backgroundColor: string;
  currency: NativeCurrencyKey;
}) {
  const { isDarkMode } = useColorMode();
  const dimmedBackground = isDarkMode
    ? getSolidColorEquivalent({ background: backgroundColor, foreground: globalColors.grey100, opacity: 0.08 })
    : undefined;

  const percentageChange = useDerivedValue(() => getPercentageChange(activeCandle));
  const isChangePositive = useDerivedValue(() => percentageChange.value >= 0);

  const closeColor = useDerivedValue(() => {
    const color = getCloseColor(isChangePositive.value ? BadgeTheme.Green : BadgeTheme.Red, isDarkMode);
    return withTiming(color, TIMING_CONFIGS.fastFadeConfig);
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftAlignedContent}>
        <CardColumn>
          <TimeField accentColor={accentColor} activeCandle={activeCandle} currency={currency} />
          <Badge
            accentColor={accentColor}
            backgroundColor={dimmedBackground}
            badgeTheme={BadgeTheme.Neutral}
            field={Field.Open}
            isDarkMode={isDarkMode}
          />
          <CloseBadge accentColor={accentColor} backgroundColor={dimmedBackground} closeColor={closeColor} isDarkMode={isDarkMode} />
        </CardColumn>

        <CardColumn fixedRowHeights>
          <RowSpacer />
          <CandleField accentColor={accentColor} activeCandle={activeCandle} currency={currency} field={Field.Open} />
          <View style={styles.closeFieldWrapper}>
            <CandleField accentColor={accentColor} activeCandle={activeCandle} currency={currency} field={Field.Close} />
            <PercentageChange
              closeColor={closeColor}
              isChangePositive={isChangePositive}
              isDarkMode={isDarkMode}
              percentageChange={percentageChange}
            />
          </View>
        </CardColumn>
      </View>

      <View style={styles.rightAlignedContent}>
        <CardColumn align="right" fixedRowHeights>
          <CandleField accentColor={accentColor} activeCandle={activeCandle} align="right" currency={currency} field={Field.High} />
          <CandleField accentColor={accentColor} activeCandle={activeCandle} align="right" currency={currency} field={Field.Low} />
          <CandleField accentColor={accentColor} activeCandle={activeCandle} align="right" currency={currency} field={Field.Volume} />
        </CardColumn>

        <CardColumn>
          <Badge
            accentColor={accentColor}
            backgroundColor={dimmedBackground}
            badgeTheme={BadgeTheme.Neutral}
            field={Field.High}
            isDarkMode={isDarkMode}
          />
          <Badge
            accentColor={accentColor}
            backgroundColor={dimmedBackground}
            badgeTheme={BadgeTheme.Neutral}
            field={Field.Low}
            isDarkMode={isDarkMode}
          />
          <Badge
            accentColor={accentColor}
            backgroundColor={dimmedBackground}
            badgeTheme={BadgeTheme.Neutral}
            field={Field.Volume}
            isDarkMode={isDarkMode}
          />
        </CardColumn>
      </View>
    </View>
  );
});

// ============ Components ===================================================== //

const Badge = ({
  accentColor,
  backgroundColor,
  badgeTheme,
  field,
  isDarkMode,
}: {
  accentColor: string;
  backgroundColor: string | undefined;
  badgeTheme: BadgeTheme;
  field: Exclude<Field, Field.Close>;
  isDarkMode: boolean;
}) => {
  const label = getFieldLabel(field);
  const textColor = getBadgeTextColor(badgeTheme, isDarkMode, accentColor);
  const textComponent = (
    <Text align="center" color={textColor} numberOfLines={1} size="11pt" style={getBadgeTextStyle(field)} uppercase weight="heavy">
      {label}
    </Text>
  );

  return (
    <Box
      alignItems="center"
      backgroundColor={backgroundColor}
      borderColor={getBadgeBorderColor(badgeTheme, isDarkMode, accentColor)}
      borderRadius={BADGE.borderRadius}
      borderWidth={BADGE.borderWidth}
      height={ROW_HEIGHT}
      justifyContent="center"
      paddingHorizontal={getFieldPaddingHorizontal(field)}
      width={getBadgeWidth(field)}
    >
      {badgeTheme === BadgeTheme.Accent ? (
        <TextShadow blur={12} shadowOpacity={0.24}>
          {textComponent}
        </TextShadow>
      ) : (
        textComponent
      )}
    </Box>
  );
};

const CloseBadge = ({
  accentColor,
  backgroundColor,
  closeColor,
  isDarkMode,
}: {
  accentColor: string;
  backgroundColor: string | undefined;
  closeColor?: DerivedValue<string>;
  isDarkMode: boolean;
}) => {
  const borderOpacity = BADGE_BORDER_OPACITY[isDarkMode ? 'dark' : 'light'];
  const borderStyle = useAnimatedStyle(() => ({ borderColor: opacityWorklet(closeColor?.value ?? accentColor, borderOpacity) }));

  const textStyle = useAnimatedStyle(() => ({
    color: closeColor?.value ?? accentColor,
    textShadowColor: isDarkMode ? opacityWorklet(closeColor?.value ?? accentColor, 0.24) : 'transparent',
  }));

  return (
    <Animated.View style={[styles.closeBadge, { backgroundColor }, borderStyle]}>
      <TextShadow blur={12} shadowOpacity={0.24}>
        <AnimatedText align="center" numberOfLines={1} size="11pt" style={textStyle} uppercase weight="heavy">
          {getFieldLabel(Field.Close)}
        </AnimatedText>
      </TextShadow>
    </Animated.View>
  );
};

const CandleField = ({
  accentColor,
  activeCandle,
  align,
  currency,
  field,
  style,
  wrap: Wrapper,
}: {
  accentColor: string;
  activeCandle: SharedValue<Bar | undefined>;
  align?: TextProps['align'];
  currency: NativeCurrencyKey;
  field: Field;
  style?: AnimatedTextProps['style'];
  wrap?: ComponentType<{ children: ReactElement<TextProps | AnimatedTextProps> }>;
}) => {
  const animatedText = (
    <AnimatedText
      align={align}
      color={getFieldTextColor(field, accentColor)}
      numberOfLines={1}
      selector={activeCandle => {
        'worklet';
        return selectFieldLabel(activeCandle, currency, field);
      }}
      size={getFieldTextSize(field)}
      style={getFieldStyle(field, style)}
      tabularNumbers
      weight={getFieldTextWeight(field)}
    >
      {activeCandle}
    </AnimatedText>
  );

  return Wrapper ? <Wrapper>{animatedText}</Wrapper> : animatedText;
};

const PercentageChange = ({
  closeColor,
  isChangePositive,
  isDarkMode,
  percentageChange,
}: {
  closeColor: DerivedValue<string>;
  isChangePositive: DerivedValue<boolean>;
  isDarkMode: boolean;
  percentageChange: DerivedValue<number>;
}) => {
  const percentageChangeText = useDerivedValue(() => formatPercentageChange(percentageChange.value));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withSpring(`${isChangePositive.value ? '0deg' : '180deg'}`, SPRING_CONFIGS.springConfig) }],
  }));

  const colorStyle = useAnimatedStyle(() => ({
    color: closeColor.value,
    textShadowColor: isDarkMode ? opacityWorklet(closeColor.value, 0.24) : 'transparent',
  }));

  return (
    <View style={styles.percentageChangeContainer}>
      <TextShadow blur={12} shadowOpacity={0.24}>
        <AnimatedText size="icon 10px" style={[arrowStyle, colorStyle]} weight="black">
          􀄨
        </AnimatedText>
      </TextShadow>
      <TextShadow blur={12} shadowOpacity={0.24}>
        <AnimatedText numberOfLines={1} size="13pt" style={[styles.flex, colorStyle]} tabularNumbers weight="heavy">
          {percentageChangeText}
        </AnimatedText>
      </TextShadow>
    </View>
  );
};

const TimeField = ({
  accentColor,
  activeCandle,
  currency,
}: {
  accentColor: string;
  activeCandle: SharedValue<Bar | undefined>;
  currency: NativeCurrencyKey;
}) => {
  return (
    <View style={styles.timeLabelContainer}>
      <CandleField
        accentColor={accentColor}
        activeCandle={activeCandle}
        currency={currency}
        field={Field.Time}
        style={styles.timeLabel}
        wrap={({ children }) => (
          <TextShadow blur={12} shadowOpacity={0.24}>
            {children}
          </TextShadow>
        )}
      />
    </View>
  );
};

// ============ Layout Helpers ================================================= //

const CardColumn = ({
  align = 'left',
  children,
  fixedRowHeights,
  flex = align === 'right',
}: {
  align?: 'left' | 'right';
  children: [ReactNode, ReactNode, ReactNode];
  fixedRowHeights?: boolean;
  flex?: boolean;
}) => {
  const baseStyle = align === 'left' ? styles.columnLeftAligned : styles.columnRightAligned;
  const columnStyle = flex ? [styles.flex, baseStyle] : baseStyle;

  if (!fixedRowHeights) return <View style={columnStyle}>{children}</View>;

  return (
    <View style={columnStyle}>
      {children.map((child, index) => (
        <View key={index} style={styles.fieldContainer}>
          {child}
        </View>
      ))}
    </View>
  );
};

const RowSpacer = () => <View style={styles.rowSpacer} />;

// ============ Formatters ===================================================== //

function determineNumberOfDecimals(absoluteChange: number): number {
  'worklet';
  if (absoluteChange >= 1000) return 0;
  if (absoluteChange >= 100) return 1;
  if (absoluteChange > 0.01) return 2;
  return 3;
}

function formatPercentageChange(percentageChange: number): string {
  'worklet';
  if (!percentageChange) return '0.000%';
  const absoluteChange = Math.abs(percentageChange);
  const numberOfDecimals = determineNumberOfDecimals(absoluteChange);
  return `${addCommasToNumber(absoluteChange.toFixed(numberOfDecimals))}%`;
}

function formatPrice(price: number | undefined, currency: NativeCurrencyKey): string {
  'worklet';
  if (!price) return '';
  return formatAssetPrice({
    currency,
    decimalPlaces: supportedNativeCurrencies[currency].decimals,
    prefix: supportedNativeCurrencies[currency].symbol,
    value: price,
  });
}

function insertCurrencySymbol(value: string, currency: SupportedCurrencyKey): string {
  'worklet';
  const { alignment, symbol } = supportedNativeCurrencies[currency];
  return alignment === 'left' ? `${symbol}${value}` : `${value}${symbol}`;
}

const SPACER = ' ';
const NO_VOLUME_LABEL = i18n.t(i18n.l.expanded_state.chart.candlestick.no_volume_label).toUpperCase();

function formatVolume(volume: number | undefined, currency: NativeCurrencyKey): string {
  'worklet';
  if (!volume) return NO_VOLUME_LABEL;
  const formattedVolume = abbreviateNumberWorklet(volume, 2, 'short', true).toUpperCase();
  const willShowZero = formattedVolume === '0.00';
  if (willShowZero) {
    return `<${SPACER}${insertCurrencySymbol('0.01', currency)}`;
  }
  return insertCurrencySymbol(formattedVolume, currency);
}

// ============ Utilities ====================================================== //

function getBadgeBorderColor(theme: BadgeTheme, isDarkMode: boolean, accentColor: string): BoxProps['borderColor'] {
  'worklet';
  const colorMode = isDarkMode ? 'dark' : 'light';
  const makeTransparent = (color: string, opacity?: number) => opacityWorklet(color, opacity ?? BADGE_BORDER_OPACITY[colorMode]);

  switch (theme) {
    case BadgeTheme.Accent:
    case BadgeTheme.Neutral:
      return { custom: makeTransparent(accentColor) };
    case BadgeTheme.Green:
      return { custom: makeTransparent(foregroundColors.green[colorMode], isDarkMode ? 0.16 : undefined) };
    case BadgeTheme.Red:
      return { custom: makeTransparent(foregroundColors.red[colorMode], isDarkMode ? 0.16 : undefined) };
  }
}

function getBadgeTextColor(theme: BadgeTheme, isDarkMode: boolean, accentColor: string): TextProps['color'] {
  switch (theme) {
    case BadgeTheme.Accent:
      return { custom: accentColor };
    case BadgeTheme.Neutral:
      return isDarkMode ? 'labelTertiary' : 'labelQuaternary';
    case BadgeTheme.Green:
      return 'green';
    case BadgeTheme.Red:
      return 'red';
  }
}

function getBadgeTextStyle(field: Field): TextProps['style'] {
  switch (field) {
    case Field.Close:
    case Field.Open:
      return { letterSpacing: 0.72 };
    default:
      return undefined;
  }
}

function getBadgeWidth(field: Field): BoxProps['width'] | undefined {
  switch (field) {
    case Field.High:
    case Field.Low:
    case Field.Volume:
      return ROW_HEIGHT;
    default:
      return undefined;
  }
}

function getCloseColor(theme: Exclude<BadgeTheme, BadgeTheme.Accent>, isDarkMode: boolean): string {
  'worklet';
  const colorMode = isDarkMode ? 'dark' : 'light';
  switch (theme) {
    case BadgeTheme.Green:
      return foregroundColors.green[colorMode];
    case BadgeTheme.Neutral:
      return foregroundColors.labelTertiary[colorMode];
    case BadgeTheme.Red:
      return foregroundColors.red[colorMode];
  }
}

function getFieldLabel(field: Field): string {
  'worklet';
  return i18n.t(i18n.l.expanded_state.chart.candlestick.candle_field_labels[field]);
}

function getFieldPaddingHorizontal(field: Field): { custom: number } | undefined {
  switch (field) {
    case Field.High:
    case Field.Low:
    case Field.Volume:
      return undefined;
    default:
      return { custom: BADGE.paddingHorizontal };
  }
}

function getFieldStyle(field: Field, style: AnimatedTextProps['style']): AnimatedTextProps['style'] {
  switch (field) {
    case Field.High:
    case Field.Low:
      return [{ width: '100%' }, style];
    case Field.Time:
      return [{ letterSpacing: 0.6 }, style];
    default:
      return style;
  }
}

function getFieldTextColor(field: Field, accentColor: string): TextProps['color'] {
  switch (field) {
    case Field.Close:
    case Field.Open:
      return 'label';
    case Field.Time:
      return { custom: accentColor };
    default:
      return 'labelQuaternary';
  }
}

function getFieldTextSize(field: Field): TextProps['size'] {
  switch (field) {
    case Field.Close:
    case Field.Open:
      return '13pt';
    default:
      return '11pt';
  }
}

function getFieldTextWeight(field: Field): TextProps['weight'] {
  switch (field) {
    case Field.High:
    case Field.Low:
    case Field.Volume:
      return 'bold';
    default:
      return 'heavy';
  }
}

function getPercentageChange(activeCandle: SharedValue<Bar | undefined>): number {
  'worklet';
  const candle = activeCandle.value;
  if (!candle) return 0;
  return ((candle.c - candle.o) / candle.o) * 100;
}

function selectFieldLabel(activeCandle: SharedValue<Bar | undefined>, currency: NativeCurrencyKey, field: Field): string | undefined {
  'worklet';
  if (!activeCandle.value) return undefined;
  const fieldValue = activeCandle.value[field];
  switch (field) {
    case Field.Time:
      return formatTimestamp(fieldValue, TIME_FORMAT_OPTIONS);
    case Field.Volume:
      return formatVolume(fieldValue, currency);
    default:
      return formatPrice(fieldValue, currency);
  }
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  closeBadge: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: BADGE.borderRadius,
    borderWidth: BADGE.borderWidth,
    height: ROW_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: BADGE.paddingHorizontal - BADGE.borderWidth,
  },
  closeFieldWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  columnLeftAligned: {
    flexDirection: 'column',
    flexShrink: 0,
    gap: 10,
  },
  columnRightAligned: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    flexShrink: 0,
    gap: 10,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: IS_IOS ? -6 : 0,
    paddingHorizontal: 24,
    position: 'relative',
    width: '100%',
  },
  fieldContainer: {
    height: 20,
    justifyContent: 'center',
    width: '100%',
  },
  flex: {
    flex: 1,
  },
  leftAlignedContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  percentageChangeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  rightAlignedContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  rowSpacer: {
    height: ROW_HEIGHT,
    width: '100%',
  },
  timeLabel: {
    paddingLeft: BADGE.borderWidth,
    position: 'absolute',
    width: DEVICE_WIDTH / 2,
  },
  timeLabelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    height: ROW_HEIGHT,
    width: '100%',
  },
});
