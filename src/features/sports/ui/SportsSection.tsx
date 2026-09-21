import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { Bleed } from '@/design-system/components/Bleed/Bleed';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { type SportsHost } from '@/features/sports/core/browse';
import { type SportsSection } from '@/features/sports/core/sections';
import { sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import * as i18n from '@/languages';

export function SportsSectionHeading({ section, host }: { section: SportsSection; host: SportsHost }) {
  const { isDarkMode } = useColorMode();
  const scopeId = section.scopeId;
  const scopeName = useSportsStore(state => (scopeId ? state.catalog?.scopes[scopeId]?.name : undefined));
  const title = scopeId ? (scopeName ?? '') : i18n.t(SECTION_LABELS[section.type]);
  return (
    <ButtonPressAnimation
      disabled={!scopeId}
      onPress={scopeId ? () => sportsActions.selectDestination(host, { type: 'scope', scopeId }) : undefined}
      scaleTo={0.98}
    >
      <View style={styles.heading}>
        {section.type === 'live' && !section.scopeId && (
          <View style={styles.liveIndicator}>
            <View style={[styles.liveRing, { borderColor: isDarkMode ? 'rgba(255,88,77,0.3)' : 'rgba(250,66,60,0.3)' }]}>
              <View style={[styles.liveDot, { backgroundColor: isDarkMode ? '#E65048' : '#FA423C' }]} />
            </View>
          </View>
        )}
        <Text color="label" size="22pt" weight="heavy">
          {title}
        </Text>
        <Bleed vertical="8px">
          <View style={!isDarkMode && [styles.badgeShadow, styles.countCorners]}>
            <View style={[styles.count, styles.countCorners, isDarkMode ? styles.darkCount : styles.tightBadgeShadow]}>
              {!isDarkMode && (
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.countCorners, styles.clip]}>
                  <LinearGradient colors={LIGHT_BADGE_GRADIENT} style={StyleSheet.absoluteFill} />
                </View>
              )}
              <Text color="labelSecondary" size="13pt" weight="heavy">
                {section.gameIds.length}
              </Text>
              <Border
                borderRadius={9}
                borderWidth={4 / 3}
                borderColor={{ custom: isDarkMode ? 'rgba(255,255,255,0.06)' : '#FFFFFF' }}
                enableInLightMode
              />
            </View>
          </View>
        </Bleed>
        {section.scopeId && (
          <TextIcon
            color={{ custom: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
            size="icon 15px"
            weight="heavy"
            containerSize={16}
          >
            {'􀯻'}
          </TextIcon>
        )}
      </View>
    </ButtonPressAnimation>
  );
}

export function SportsSectionHeadingSkeleton() {
  const backgroundColor = useForegroundColor('fillTertiary');
  return (
    <View style={styles.heading}>
      <View style={[styles.skeletonTitle, { backgroundColor }]} />
      <Bleed vertical="8px">
        <View style={[styles.skeletonCount, { backgroundColor }]} />
      </Bleed>
    </View>
  );
}

export function SportsSectionToggle({ expanded, remaining, onPress }: { expanded: boolean; remaining: number; onPress: () => void }) {
  const { isDarkMode } = useColorMode();
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.98}>
      <View style={styles.expand}>
        <View style={!isDarkMode && [styles.badgeShadow, styles.expandCorners]}>
          <View style={[styles.expandIcon, styles.expandCorners, isDarkMode ? styles.darkExpandIcon : styles.tightBadgeShadow]}>
            {!isDarkMode && (
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
            {!isDarkMode && <Border borderRadius={10} borderWidth={4 / 3} borderColor="white" enableInLightMode />}
          </View>
        </View>
        <Text color="labelTertiary" size="17pt" weight="bold">
          {i18n.t(expanded ? i18n.l.sports.show_less : i18n.l.sports.show_more, { count: remaining })}
        </Text>
      </View>
    </ButtonPressAnimation>
  );
}

const SECTION_LABELS = {
  live: i18n.l.sports.live,
  today: i18n.l.sports.today,
  upcoming: i18n.l.sports.upcoming,
  search: i18n.l.sports.search_results,
};

const LIGHT_BADGE_GRADIENT = ['rgba(255,255,255,0.54)', 'rgba(255,255,255,0.81)'] as const;

const styles = StyleSheet.create({
  skeletonTitle: { width: 92, height: 16, borderRadius: 8 },
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
    paddingHorizontal: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countCorners: { borderRadius: 9, borderCurve: 'continuous' },
  darkCount: { backgroundColor: 'rgba(255,255,255,0.03)' },
  liveIndicator: {
    width: 16,
    height: 16,
    marginRight: 10,
  },
  liveRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  darkExpandIcon: { backgroundColor: 'rgba(255,255,255,0.16)' },
  badgeShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  tightBadgeShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
});
