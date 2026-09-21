import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { type SportsHost } from '@/features/sports/core/browse';
import { sportsBrowseStores, sportsReadStatusStores } from '@/features/sports/data/sportsBrowse';
import { sportsActions } from '@/features/sports/data/sportsStore';
import { SportsSkeleton } from '@/features/sports/ui/SportsSkeleton';
import * as i18n from '@/languages';

export function SportsReadStatus({ host }: { host: SportsHost }) {
  const status = sportsReadStatusStores[host]();
  const layout = sportsBrowseStores[host](state => state.layout);
  switch (status) {
    case 'none':
      return null;
    case 'loading':
      return <SportsSkeleton layout={layout} />;
    case 'error':
      return <SportsReadError retry={() => sportsActions.retry(host)} />;
    case 'more':
      return <LoadMoreGames host={host} />;
    case 'empty':
      return <EmptyGames message={i18n.t(i18n.l.sports.empty)} />;
    case 'search-empty':
      return <EmptyGames message={i18n.t(i18n.l.sports.search_empty)} />;
  }
}

function EmptyGames({ message }: { message: string }) {
  return (
    <View style={styles.message}>
      <Text align="center" color="labelTertiary" size="17pt" weight="bold">
        {message}
      </Text>
    </View>
  );
}

function SportsReadError({ retry }: { retry: () => Promise<void> }) {
  const fill = useForegroundColor('fillTertiary');
  const [pending, setPending] = useState(false);
  const onPress = async () => {
    setPending(true);
    try {
      await retry();
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={styles.message}>
      <TextIcon color="labelQuaternary" size="icon 34px" weight="regular" containerSize={40}>
        {'􀇿'}
      </TextIcon>
      <Text align="center" color="labelSecondary" size="20pt" weight="bold">
        {i18n.t(i18n.l.sports.error)}
      </Text>
      <View
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled: pending }}
        accessibilityLabel={i18n.t(i18n.l.sports.retry)}
        onAccessibilityTap={pending ? undefined : onPress}
      >
        <ButtonPressAnimation disabled={pending} onPress={onPress} scaleTo={0.96}>
          <View style={[styles.retry, { backgroundColor: fill, opacity: pending ? 0.5 : 1 }]}>
            <TextIcon color="accent" size="icon 15px" weight="bold" containerSize={20}>
              {'􀅈'}
            </TextIcon>
            <Text color="accent" size="17pt" weight="bold">
              {i18n.t(i18n.l.sports.retry)}
            </Text>
          </View>
        </ButtonPressAnimation>
      </View>
    </View>
  );
}

function LoadMoreGames({ host }: { host: SportsHost }) {
  const [pending, setPending] = useState(false);
  const onPress = async () => {
    setPending(true);
    try {
      await sportsActions.loadMore(host);
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={styles.loadMore}>
      <ButtonPressAnimation disabled={pending} onPress={onPress} scaleTo={0.96}>
        <Text color={pending ? 'labelTertiary' : 'accent'} size="17pt" weight="bold">
          {i18n.t(i18n.l.sports.load_more)}
        </Text>
      </ButtonPressAnimation>
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    padding: 28,
  },
  retry: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadMore: {
    alignItems: 'center',
    padding: 28,
  },
});
