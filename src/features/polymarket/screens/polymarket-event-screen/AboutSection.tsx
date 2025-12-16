import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Box, Text, TextIcon, TextShadow, useColorMode } from '@/design-system';
import { CATEGORIES } from '@/features/polymarket/constants';
import { PolymarketEvent, PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import { Navigation } from '@/navigation';
import formatURLForDisplay from '@/utils/formatURLForDisplay';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { format } from 'date-fns';
import { memo, useMemo } from 'react';
import Routes from '@/navigation/routesNames';

export const AboutSection = memo(function AboutSection({
  event,
  screenBackgroundColor,
}: {
  event: PolymarketEvent | PolymarketMarketEvent;
  screenBackgroundColor: string;
}) {
  return (
    <Box gap={24}>
      <Box flexDirection="row" alignItems="center" gap={10}>
        <Box style={{ opacity: 0.4 }}>
          <TextIcon size="icon 17px" weight="bold" color="label">
            {'􀅴'}
          </TextIcon>
        </Box>
        <Text size="20pt" weight="heavy" color="label">
          {'About'}
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
  const backgroundColor = getSolidColorEquivalent({ background: screenBackgroundColor, foreground: '#F5F8FF', opacity: 0.04 });
  return (
    <ButtonPressAnimation
      onPress={() => {
        Navigation.handleAction(Routes.POLYMARKET_MARKET_DESCRIPTION_SHEET, { description });
      }}
    >
      <Box
        width="full"
        backgroundColor={backgroundColor}
        borderRadius={26}
        padding={'20px'}
        borderWidth={2}
        borderColor={{ custom: opacityWorklet('#F5F8FF', 0.02) }}
      >
        <Text color="label" size="17pt / 150%" weight="medium" numberOfLines={3}>
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
            <Box flexDirection="row" alignItems="center" gap={6} backgroundColor={backgroundColor}>
              <Text color="label" size="15pt" weight="bold">
                {'Show Rules'}
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
  const { isDarkMode } = useColorMode();

  const rowItems = useMemo(() => {
    const items = [];
    if (event.endDate) {
      items.push({
        title: 'End Date',
        value: format(new Date(event.endDate), 'MMM d, yyyy'),
        icon: '􀐫',
      });
    }

    if (event.resolutionSource) {
      items.push({
        title: 'Res. Source',
        value: formatURLForDisplay(event.resolutionSource),
        icon: '􀉣',
        rightIcon: '􀄯',
      });
    }

    const primaryTag = 'tags' in event ? event.tags[0] : undefined;
    const category = CATEGORIES[primaryTag?.slug as keyof typeof CATEGORIES];

    if (category) {
      items.push({
        title: 'Category',
        value: category.label,
        icon: '􀋡',
        valueColor: isDarkMode ? category.color.dark : category.color.light,
      });
    }

    return items;
  }, [event, isDarkMode]);

  return (
    <Box gap={4}>
      {rowItems.map((infoRow, index) => (
        <InfoRow
          key={index}
          title={infoRow.title}
          value={infoRow.value}
          icon={infoRow.icon}
          highlighted={index % 2 === 1}
          rightIcon={infoRow.rightIcon}
          valueColor={infoRow.valueColor}
        />
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
  valueColor,
}: {
  title: string;
  value: string;
  icon: string;
  highlighted: boolean;
  rightIcon: string | undefined;
  valueColor: string | undefined;
}) {
  return (
    <Box
      height={36}
      backgroundColor={highlighted ? opacityWorklet('#FFFFFF', 0.04) : 'transparent'}
      justifyContent="center"
      paddingHorizontal="10px"
      borderRadius={14}
      borderWidth={THICK_BORDER_WIDTH}
      borderColor={{ custom: highlighted ? opacityWorklet('#FFFFFF', 0.02) : 'transparent' }}
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
            <Text align="right" color={valueColor ? { custom: valueColor } : 'label'} weight="semibold" size="17pt">
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
