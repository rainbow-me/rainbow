import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { type SportsHost } from '@/features/sports/core/browse';
import { type SportsScope } from '@/features/sports/core/catalog';
import { type SportsSection } from '@/features/sports/core/sections';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { badgeShadows } from '@/features/sports/ui/badgeShadows';
import { LiveIndicator } from '@/features/sports/ui/LiveIndicator';
import * as i18n from '@/languages';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { black, white } from '@/worklets/colors';

// ============ Constants ====================================================== //

const SECTION_LABELS = {
  live: i18n.l.sports.live,
  today: i18n.l.sports.today,
  upcoming: i18n.l.sports.upcoming,
  search: i18n.l.sports.search_results,
};

const LIGHT_BADGE_GRADIENT = [white(0.54), white(0.81)] as const;
const HEADING_TEXT_SIZE = '22pt';

// ============ Components ===================================================== //

export function SportsSectionHeading({
  section,
  host,
  scope,
  isDarkMode,
}: {
  section: SportsSection;
  host: SportsHost;
  scope?: SportsScope;
  isDarkMode: boolean;
}): ReactElement {
  const scopeId = section.scopeId;

  const title = scopeId ? (scope?.name ?? '') : i18n.t(SECTION_LABELS[section.type]);

  return (
    <ButtonPressAnimation
      disabled={!scopeId}
      onPress={scopeId ? () => sportsNavigationStores[host].getState().select(scopeId) : undefined}
      scaleTo={0.98}
    >
      <View style={styles.heading}>
        {section.type === 'live' && !scopeId ? (
          <View style={[styles.accessory, styles.liveIndicator]}>
            <LiveIndicator />
          </View>
        ) : null}

        <Text color="label" size={HEADING_TEXT_SIZE} weight="heavy">
          {title}
        </Text>

        <View style={styles.accessory}>
          <View style={isDarkMode ? undefined : [badgeShadows.soft, styles.countCorners]}>
            <View style={[styles.count, styles.countCorners, isDarkMode ? styles.darkCount : badgeShadows.tight]}>
              {isDarkMode ? null : (
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.countCorners, styles.clip]}>
                  <LinearGradient colors={LIGHT_BADGE_GRADIENT} style={StyleSheet.absoluteFill} />
                </View>
              )}

              <Text align="center" color="labelSecondary" size="13pt" style={styles.countText} weight="heavy">
                {section.gameIds.length}
              </Text>

              <Border
                borderRadius={9}
                borderWidth={THICK_BORDER_WIDTH}
                borderColor={{ custom: white(isDarkMode ? 0.06 : 1) }}
                enableInLightMode
              />
            </View>
          </View>
        </View>

        {scopeId ? (
          <View style={styles.accessory}>
            <TextIcon color={{ custom: (isDarkMode ? white : black)(0.3) }} size="icon 15px" weight="heavy">
              {'􀯻'}
            </TextIcon>
          </View>
        ) : null}
      </View>
    </ButtonPressAnimation>
  );
}

export function SportsSectionHeadingSkeleton({ backgroundColor }: { backgroundColor: string }): ReactElement {
  return (
    <View style={styles.heading}>
      <View style={[styles.skeletonTitle, { backgroundColor }]}>
        <Text color={{ custom: 'transparent' }} size={HEADING_TEXT_SIZE} weight="heavy">
          {' '}
        </Text>
      </View>
      <View style={styles.accessory}>
        <View style={[styles.skeletonCount, { backgroundColor }]} />
      </View>
    </View>
  );
}

export function SportsSectionToggle({
  expanded,
  remaining,
  onPress,
  isDarkMode,
}: {
  expanded: boolean;
  remaining: number;
  onPress: () => void;
  isDarkMode: boolean;
}): ReactElement {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.98}>
      <View style={styles.expand}>
        <View style={isDarkMode ? undefined : [badgeShadows.soft, styles.expandCorners]}>
          <View style={[styles.expandIcon, styles.expandCorners, isDarkMode ? styles.darkExpandIcon : badgeShadows.tight]}>
            {isDarkMode ? null : (
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.expandCorners, styles.clip]}>
                <LinearGradient colors={LIGHT_BADGE_GRADIENT} style={StyleSheet.absoluteFill} />
              </View>
            )}

            <TextIcon
              color={isDarkMode ? 'labelQuaternary' : 'labelTertiary'}
              size="icon 10px"
              weight="black"
              containerSize={20}
              textStyle={styles.expandChevron}
            >
              {expanded ? '􀆇' : '􀆈'}
            </TextIcon>

            {isDarkMode ? null : <Border borderRadius={10} borderWidth={THICK_BORDER_WIDTH} borderColor="white" enableInLightMode />}
          </View>
        </View>

        <Text color="labelTertiary" size="17pt" weight="bold">
          {i18n.t(expanded ? i18n.l.sports.show_less : i18n.l.sports.show_more, { count: remaining })}
        </Text>
      </View>
    </ButtonPressAnimation>
  );
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  accessory: { height: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  skeletonTitle: { width: 92, borderRadius: 8 },
  skeletonCount: { width: 24, height: 24, borderRadius: 9, borderCurve: 'continuous' },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  count: {
    height: 24,
    minWidth: 24,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countCorners: { borderRadius: 9, borderCurve: 'continuous' },
  countText: { width: '100%' },
  darkCount: { backgroundColor: white(0.03) },
  liveIndicator: {
    width: 16,
    marginRight: 10,
  },
  expand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  expandChevron: { transform: [{ translateY: 0.5 }] },
  expandIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandCorners: { borderRadius: 10, borderCurve: 'continuous' },
  clip: { overflow: 'hidden' },
  darkExpandIcon: { backgroundColor: white(0.16) },
});
