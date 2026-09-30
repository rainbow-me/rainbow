import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { type SportsDestination, type SportsHost } from '@/features/sports/core/browse';
import { type SportsScope } from '@/features/sports/core/catalog';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { type SportsPage } from '@/features/sports/data/sportsPageStore';
import { LiveIndicator } from '@/features/sports/ui/LiveIndicator';
import { SportsBadge } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';

const HEADER_HEIGHT = 44;
const BACK_BUTTON_INSET = 4;

/**
 * Title and back navigation for a Sports browse page.
 */
export const SportsHeader = memo(function SportsHeader({
  host,
  isDarkMode,
  page,
  scope,
  parent,
  back,
}: {
  host: SportsHost;
  isDarkMode: boolean;
  page: SportsPage;
  scope: SportsScope | undefined;
  parent: SportsScope | undefined;
  back: SportsDestination | undefined;
}): ReactElement {
  const title =
    scope?.name ?? i18n.t(page === 'live' ? i18n.l.sports.live : page === 'sports' ? i18n.l.sports.all_sports : i18n.l.sports.title);

  return (
    <View style={[styles.header, back ? styles.nestedHeader : undefined]}>
      {back ? (
        <View style={styles.back}>
          <ButtonPressAnimation onPress={() => sportsNavigationStores[host].getState().open(back)} scaleTo={0.8} style={styles.backButton}>
            <TextIcon color="label" size="icon 16px" weight="heavy" containerSize={20}>
              {'􀆉'}
            </TextIcon>
          </ButtonPressAnimation>
        </View>
      ) : null}

      {scope ? <SportsBadge isDarkMode={isDarkMode} scope={scope} size={HEADER_HEIGHT} /> : page === 'live' ? <LiveIndicator /> : null}

      <View style={styles.headerText}>
        {parent ? (
          <Text color="labelQuaternary" size="15pt" weight="semibold" numberOfLines={1}>
            {parent.name}
          </Text>
        ) : null}

        <Text color="label" size={scope ? '20pt' : '30pt'} weight="heavy" numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  nestedHeader: { paddingLeft: HEADER_HEIGHT + BACK_BUTTON_INSET },
  back: {
    position: 'absolute',
    left: BACK_BUTTON_INSET,
    top: 0,
  },
  backButton: {
    width: HEADER_HEIGHT,
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 10 },
});
