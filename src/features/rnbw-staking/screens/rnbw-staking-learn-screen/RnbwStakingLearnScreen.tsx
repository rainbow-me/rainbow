import { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SheetHandleFixedToTop from '@/components/sheet/SheetHandleFixedToTop';
import { Box, Text, useColorMode } from '@/design-system';
import Routes from '@/navigation/routesNames';
import Navigation from '@/navigation/Navigation';
import { RnbwCoinIcon } from '@/components/RnbwCoinIcon';
import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';
import { RnbwThemedButton } from '@/features/rnbw-membership/components/RnbwThemedButton';
import { UnstakePenaltySign } from '@/features/rnbw-staking/components/UnstakePenaltySign';
import { ProgressMeter } from '@/features/rnbw-membership/components/ProgressMeter';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { LinearGradient } from 'expo-linear-gradient';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';

const ICON_CONTAINER_WIDTH = 62;
const RNBW_ICON_SIZE = 52;
const PROGRESS_METER_HEIGHT = 63;
const PROGRESS_LABEL_HEIGHT = 24;
const ARROW_SIZE = 7;

export const RnbwStakingLearnScreen = memo(function RnbwStakingLearnScreen() {
  const exitFeePercentage = useStakingPositionStore(s => s.getExitFeePercentage());
  const { top: safeAreaTop, bottom: safeAreaBottom } = useSafeAreaInsets();
  const { isDarkMode } = useColorMode();
  const screenBackgroundColor = isDarkMode ? '#090909' : '#FEFEFE';
  const backgroundGradientColor = isDarkMode ? '#FADB71' : '#EFC035';

  return (
    <Box backgroundColor={screenBackgroundColor} style={styles.container}>
      <LinearGradient
        colors={[opacity(backgroundGradientColor, 0.2), opacity(backgroundGradientColor, 0)]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.backgroundGradient}
      />
      <SheetHandleFixedToTop top={safeAreaTop + 6} />
      <View style={[styles.content, { marginTop: safeAreaTop + 40, paddingBottom: safeAreaBottom + 8 }]}>
        <Box gap={64} flexGrow={1}>
          <Box alignItems="center" gap={24}>
            <Text align="center" size="17pt" weight="heavy" color={{ custom: '#D7A921' }}>
              {i18n.t(i18n.l.rnbw_staking.learn_screen.introducing)}
            </Text>
            <Text align="center" color="label" size="44pt" weight="heavy">
              {i18n.t(i18n.l.rnbw_staking.learn_screen.title)}
            </Text>
            <Text align="center" color="labelTertiary" size="20pt / 135%" weight="semibold">
              {i18n.t(i18n.l.rnbw_staking.learn_screen.description)}
            </Text>
          </Box>
          <Box gap={42} flexGrow={1}>
            <ReasonRow
              title={i18n.t(i18n.l.rnbw_staking.learn_screen.fee_cashback)}
              subtitle={i18n.t(i18n.l.rnbw_staking.learn_screen.fee_cashback_subtitle)}
              icon={<LockedRnbwIcon />}
            />
            <ReasonRow
              title={i18n.t(i18n.l.rnbw_staking.learn_screen.exit_fee_title, { exitFeePercentage })}
              subtitle={i18n.t(i18n.l.rnbw_staking.learn_screen.exit_fee_subtitle, { exitFeePercentage })}
              icon={<UnstakePenaltyIcon percentage={exitFeePercentage} />}
            />
            <ReasonRow
              title={i18n.t(i18n.l.rnbw_staking.learn_screen.stay_in_to_earn_more)}
              subtitle={i18n.t(i18n.l.rnbw_staking.learn_screen.stay_in_to_earn_more_subtitle)}
              icon={<ProgressMeterIcon />}
            />
          </Box>
        </Box>
        <RnbwThemedButton
          onPress={navigateToStakingScreen}
          label={i18n.t(i18n.l.rnbw_staking.learn_screen.enable_staking)}
          height={48}
          style={styles.button}
        />
      </View>
    </Box>
  );
});

function ReasonRow({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) {
  return (
    <Box flexDirection="row" alignItems="flex-start" gap={20}>
      <View style={styles.iconContainer}>{icon}</View>
      <Box flexShrink={1} gap={12}>
        <Text color="label" size="20pt" weight="heavy">
          {title}
        </Text>
        <Text color="labelTertiary" size="17pt / 135%" weight="semibold">
          {subtitle}
        </Text>
      </Box>
    </Box>
  );
}

function LockedRnbwIcon() {
  const { isDarkMode } = useColorMode();
  return (
    <View style={styles.rnbwIconWrapper}>
      <GradientBorderView
        borderGradientColors={isDarkMode ? [opacity('#FFDD20', 0.5), '#FFDD20'] : ['#EFC035', '#FFE69B']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        borderWidth={3}
        style={styles.gradientBorderView}
      >
        <RnbwCoinIcon size={30} />
      </GradientBorderView>
      <Box
        width={26}
        height={26}
        borderRadius={13}
        backgroundColor={isDarkMode ? '#090909' : '#FEFEFE'}
        position="absolute"
        top={{ custom: -8 }}
        right={{ custom: -8 }}
        justifyContent="center"
        alignItems="center"
      >
        <Text color={{ custom: isDarkMode ? '#968316' : '#EFC340' }} size="13pt" weight="heavy">
          {'􀎠'}
        </Text>
      </Box>
    </View>
  );
}

function UnstakePenaltyIcon({ percentage }: { percentage: number }) {
  return (
    <UnstakePenaltySign
      percentage={percentage}
      signFaceConfig={{ width: 62, height: 42, borderRadius: 14, borderWidth: 3.33, fontSize: '20pt', fontWeight: 'heavy' }}
      signPostConfig={{ width: 8, height: 16 }}
    />
  );
}

function ProgressMeterIcon() {
  const { isDarkMode } = useColorMode();
  const backgroundColor = isDarkMode ? '#383A40' : '#FFFFFF';
  return (
    <View style={styles.passiveIncomeWrapper}>
      <ProgressMeter progress={0.5} height={PROGRESS_METER_HEIGHT} width={28} notchWidth={8} notchHeight={2} />
      <Box style={[styles.progressLabel, { backgroundColor }]}>
        <View style={[styles.progressLabelArrow, { backgroundColor }]} />
        <Text color="green" size="13pt" weight="heavy" style={styles.progressLabelText}>
          {'52%'}
        </Text>
      </Box>
    </View>
  );
}

function navigateToStakingScreen() {
  Navigation.replace(Routes.RNBW_STAKING_SCREEN);
}

const styles = StyleSheet.create({
  backgroundGradient: {
    height: 300,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
  },
  button: {
    width: '100%',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  gradientBorderView: {
    alignItems: 'center',
    backgroundColor: 'white',
    height: RNBW_ICON_SIZE,
    justifyContent: 'center',
    width: RNBW_ICON_SIZE,
  },
  iconContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: ICON_CONTAINER_WIDTH,
  },
  passiveIncomeWrapper: {
    marginLeft: 8,
  },
  progressLabel: {
    alignItems: 'center',
    borderRadius: 10,
    bottom: 0,
    height: PROGRESS_LABEL_HEIGHT,
    justifyContent: 'center',
    left: 20,
    position: 'absolute',
    right: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    top: (PROGRESS_METER_HEIGHT - PROGRESS_LABEL_HEIGHT) / 2,
    width: 40,
  },
  progressLabelArrow: {
    borderCurve: 'continuous',
    borderRadius: 1,
    bottom: 0,
    height: ARROW_SIZE,
    left: -ARROW_SIZE / 3,
    position: 'absolute',
    right: 0,
    top: PROGRESS_LABEL_HEIGHT / 2 - ARROW_SIZE / 2,
    transform: [{ rotate: '45deg' }],
    width: ARROW_SIZE,
  },
  progressLabelText: {
    paddingLeft: ARROW_SIZE / 3,
  },
  rnbwIconWrapper: {
    alignItems: 'center',
    height: RNBW_ICON_SIZE,
    justifyContent: 'center',
    width: RNBW_ICON_SIZE,
  },
});
