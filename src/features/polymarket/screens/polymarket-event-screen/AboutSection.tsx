import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { getColorValueForThemeWorklet, opacityWorklet } from '@/__swaps__/utils/swaps';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Box } from '@/design-system/components/Box/Box';
import { globalColors } from '@/design-system/color/palettes';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { TextShadow } from '@/design-system/components/TextShadow/TextShadow';
import { useColorMode } from '@/design-system/color/ColorMode';
import { CATEGORIES } from '@/features/polymarket/constants';
import * as i18n from '@/languages';
import { PolymarketEvent, PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import Navigation from '@/navigation/Navigation';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { format } from 'date-fns';
import { memo, useMemo } from 'react';
import Routes from '@/navigation/routesNames';
import ConditionalWrap from 'conditional-wrap';
import { openInBrowser } from '@/utils/openInBrowser';

export const AboutSection = memo(function AboutSection({
  event,
  screenBackgroundColor,
}: {
  event: PolymarketEvent | PolymarketMarketEvent;
  screenBackgroundColor: string;
}) {
  const { isDarkMode } = useColorMode();
  const eventColor = useMemo(() => getColorValueForThemeWorklet(event?.color, isDarkMode), [event?.color, isDarkMode]);

  return (
    <Box gap={24}>
      <Box flexDirection="row" alignItems="center" gap={10}>
        <TextIcon size="icon 17px" weight="bold" color={isDarkMode ? 'label' : { custom: eventColor }} opacity={isDarkMode ? 0.4 : 1}>
          {'􀅴'}
        </TextIcon>
        <Text size="20pt" weight="heavy" color="label">
          {i18n.t(i18n.l.predictions.event.about)}
        </Text>
      </Box>
      <Description screenBackgroundColor={screenBackgroundColor} description={event.description} />
      <InfoRows event={event} />
    </Box>
  );
});

const Description = memo(function Description({
  screenBackgroundColor,
  description,
}: {
  screenBackgroundColor: string;
  description: string;
}) {
  const { isDarkMode } = useColorMode();
  const backgroundColor = isDarkMode
    ? getSolidColorEquivalent({ background: screenBackgroundColor, foreground: '#F5F8FF', opacity: 0.04 })
    : getSolidColorEquivalent({ background: screenBackgroundColor, foreground: '#09111F', opacity: 0.02 });

  return (
    <ButtonPressAnimation
      onPress={() => {
        Navigation.handleAction(Routes.POLYMARKET_MARKET_DESCRIPTION_SHEET, { description });
      }}
      scaleTo={0.95}
    >
      <Box
        width="full"
        backgroundColor={backgroundColor}
        borderRadius={26}
        padding={'20px'}
        borderWidth={isDarkMode ? 2 : THICK_BORDER_WIDTH}
        borderColor={{ custom: opacityWorklet(isDarkMode ? '#F5F8FF' : '#09111F', 0.02) }}
      >
        <Text color="labelTertiary" size="17pt / 150%" weight="medium" numberOfLines={3}>
          {description}
        </Text>
        <Box height={26} position="absolute" bottom={{ custom: 12 }} right={{ custom: 14 }} zIndex={1}>
          <Box flexDirection="row" alignItems="center" justifyContent="center">
            <EasingGradient
              startPosition={'left'}
              endPosition={'right'}
              endColor={backgroundColor}
              startColor={backgroundColor}
              endOpacity={1}
              startOpacity={0}
              style={{ height: 26, width: 100 }}
            />
            <Box flexDirection="row" alignItems="center" gap={4} backgroundColor={backgroundColor}>
              <Text color="label" size="15pt" weight="bold">
                {i18n.t(i18n.l.predictions.event.show_rules)}
              </Text>
              <TextIcon size="icon 12px" weight="heavy" color="label">
                {'􀆊'}
              </TextIcon>
            </Box>
          </Box>
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
});

const InfoRows = memo(function InfoRows({ event }: { event: PolymarketEvent | PolymarketMarketEvent }) {
  const rowItems = useMemo(() => {
    const items = [];
    if (event.endDate) {
      items.push({
        title: i18n.t(i18n.l.predictions.event.end_date),
        value: format(new Date(event.endDate), 'MMM d, yyyy'),
        icon: '􀐫',
      });
    }

    if (event.resolutionSource) {
      items.push({
        title: i18n.t(i18n.l.predictions.event.resolution_source),
        value: new URL(event.resolutionSource).hostname.replace('www.', ''),
        icon: '􀉣',
        rightIcon: '􀄯',
        onPress: () => openInBrowser(event.resolutionSource, false),
      });
    }

    const primaryTag = 'tags' in event ? event.tags[0] : undefined;
    const category = CATEGORIES[primaryTag?.slug as keyof typeof CATEGORIES];

    if (category) {
      items.push({
        title: i18n.t(i18n.l.predictions.event.category),
        value: category.label,
        icon: '􀋡',
      });
    }

    return items;
  }, [event]);

  return (
    <Box gap={4}>
      {rowItems.map((infoRow, index) => (
        <ConditionalWrap
          key={infoRow.title}
          condition={Boolean(infoRow.onPress)}
          wrap={children => (
            <ButtonPressAnimation onPress={infoRow.onPress} key={infoRow.title}>
              {children}
            </ButtonPressAnimation>
          )}
        >
          <InfoRow
            key={infoRow.title}
            title={infoRow.title}
            value={infoRow.value}
            icon={infoRow.icon}
            highlighted={index % 2 === 1}
            rightIcon={infoRow.rightIcon}
          />
        </ConditionalWrap>
      ))}
    </Box>
  );
});

function InfoRow({
  title,
  value,
  icon,
  highlighted,
  rightIcon,
}: {
  title: string;
  value: string;
  icon: string;
  highlighted: boolean;
  rightIcon: string | undefined;
}) {
  const { isDarkMode } = useColorMode();
  const highlightedBackgroundColor = isDarkMode ? opacityWorklet(globalColors.white100, 0.04) : opacityWorklet(globalColors.grey100, 0.03);
  const highlightedBorderColor = opacityWorklet(isDarkMode ? globalColors.white100 : globalColors.grey100, 0.02);

  return (
    <Box
      height={36}
      backgroundColor={highlighted ? highlightedBackgroundColor : 'transparent'}
      justifyContent="center"
      paddingHorizontal="10px"
      borderRadius={14}
      borderWidth={THICK_BORDER_WIDTH}
      borderColor={{ custom: highlighted ? highlightedBorderColor : 'transparent' }}
    >
      <Box width={'full'} flexDirection="row" alignItems="center" gap={12}>
        <TextIcon color="labelSecondary" containerSize={20} size="icon 15px" weight="medium">
          {icon}
        </TextIcon>
        <Text style={{ flex: 1 }} numberOfLines={1} ellipsizeMode="tail" color="labelSecondary" weight="medium" size="17pt">
          {title}
        </Text>

        <Box flexDirection="row" alignItems="center" gap={8}>
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text align="right" color="label" weight="semibold" numberOfLines={1} size="17pt">
              {value}
            </Text>
          </TextShadow>
          {rightIcon && (
            <TextIcon color="labelSecondary" containerSize={20} size="icon 15px" weight="medium">
              {rightIcon}
            </TextIcon>
          )}
        </Box>
      </Box>
    </Box>
  );
}
