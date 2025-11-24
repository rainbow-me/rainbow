import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import ImgixImage from '@/components/images/ImgixImage';
import { SlackSheet } from '@/components/sheet';
import { Box, Separator, Text, TextIcon, useColorMode } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { HANDLE_COLOR, LIGHT_HANDLE_COLOR } from '@/features/perps/constants';
import { POLYMARKET_BACKGROUND_DARK, POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { Navigation } from '@/navigation';
import { memo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Routes from '@/navigation/routesNames';

export const PolymarketBrowseEventsScreen = memo(function PolymarketBrowseEventsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { isDarkMode } = useColorMode();
  const backgroundColor = isDarkMode ? POLYMARKET_BACKGROUND_DARK : POLYMARKET_BACKGROUND_LIGHT;

  return (
    <>
      <SlackSheet
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...(IS_IOS ? { height: '100%' } : {})}
        scrollEnabled
        removeTopPadding
        hideHandle
        backgroundColor={backgroundColor}
        showsVerticalScrollIndicator={false}
        additionalTopPadding={false}
        scrollIndicatorInsets={{
          bottom: safeAreaInsets.bottom,
          top: safeAreaInsets.top + 32,
        }}
      >
        <Box gap={20} width="full" paddingTop={'104px'} paddingHorizontal={'16px'}>
          <Box flexDirection="row" alignItems="center" gap={12} justifyContent="center">
            <TextIcon size="icon 17px" weight="bold" color="label">
              {'􀫸'}
            </TextIcon>
            <Text size="20pt" weight="heavy" color="label" align="center">
              {'Predictions'}
            </Text>
          </Box>
          <Separator color="separatorTertiary" direction="horizontal" thickness={THICK_BORDER_WIDTH} />
          <PolymarketEventsList />
        </Box>
      </SlackSheet>
      <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
        <Box backgroundColor={backgroundColor} height={safeAreaInsets.top + (IS_ANDROID ? 24 : 12)} width="full">
          <Box
            height={{ custom: 5 }}
            width={{ custom: 36 }}
            borderRadius={3}
            position="absolute"
            // TODO:
            style={{ backgroundColor: isDarkMode ? HANDLE_COLOR : LIGHT_HANDLE_COLOR, bottom: 0, alignSelf: 'center' }}
          />
        </Box>
        <EasingGradient
          endColor={backgroundColor}
          startColor={backgroundColor}
          endOpacity={0}
          startOpacity={1}
          style={{ height: 32, width: '100%', pointerEvents: 'none' }}
        />
      </Box>
    </>
  );
});

// TODO: this is temporary until designs are ready
const PolymarketEventsList = memo(function PolymarketEventsList() {
  const events = usePolymarketEventsStore(state => state.getData());

  if (!events) return null;

  return (
    <Box gap={12}>
      {events.map(event => (
        <PolymarketEventCard key={event.id} event={event} />
      ))}
    </Box>
  );
});

const PolymarketEventCard = memo(function PolymarketEventCard({ event }: { event: PolymarketEvent }) {
  return (
    <ButtonPressAnimation
      onPress={() => {
        Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { eventId: event.id, event: event });
      }}
    >
      <Box gap={4} background="surfacePrimaryElevated" padding="20px" borderRadius={12}>
        <Box flexDirection="row" alignItems="flex-start" justifyContent="space-between" gap={12}>
          <Text size="22pt" weight="bold" color="label" numberOfLines={2} style={{ flex: 1 }}>
            {event.title}
          </Text>
          <ImgixImage source={{ uri: event.icon }} size={32} style={{ width: 32, height: 32, borderRadius: 9 }} />
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
});
