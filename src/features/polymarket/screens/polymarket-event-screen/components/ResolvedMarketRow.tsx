import { memo, useMemo } from 'react';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { LinearGradient } from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';
import { Box, Text, useColorMode, useForegroundColor } from '@/design-system';
import ImgixImage from '@/components/images/ImgixImage';
import { formatNumber } from '@/helpers/strings';
import * as i18n from '@/languages';
// import { getSolidColorEquivalent } from '@/worklets/colors';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';

type ResolvedMarketRowProps = {
  accentColor: string;
  image?: string | undefined;
  isWinningOutcome: boolean;
  title: string;
  volume?: string;
};

export const ResolvedMarketRow = memo(function ResolvedMarketRow({
  accentColor,
  image,
  isWinningOutcome,
  title,
  volume,
}: ResolvedMarketRowProps) {
  const { isDarkMode } = useColorMode();
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  const badgeBackgroundColor = useMemo(() => {
    const wonGreen = isDarkMode ? '#1F9E39' : green;
    const lostRed = isDarkMode ? '#D53F35' : red;
    return isWinningOutcome ? wonGreen : lostRed;
  }, [isWinningOutcome, green, red, isDarkMode]);

  return (
    <GradientBorderView
      borderGradientColors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.02)']}
      locations={[0.06, 1]}
      borderWidth={2.5}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      borderRadius={24}
      style={styles.container}
    >
      <LinearGradient
        colors={isDarkMode ? ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)'] : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)']}
        locations={[0.06, 1]}
        style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.1 : 0.89 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <Box height="full" flexDirection="row" alignItems="center" gap={12} paddingRight={{ custom: 15 }}>
        {image && <ImgixImage enableFasterImage resizeMode="cover" size={40} source={{ uri: image }} style={styles.image} />}
        <Box gap={12} style={styles.flex}>
          <Box flexDirection="row" alignItems="center" gap={8}>
            <Text size="17pt" weight="bold" color={isWinningOutcome ? 'label' : 'labelTertiary'} numberOfLines={1}>
              {title}
            </Text>
          </Box>
          {volume && (
            <Text size="15pt" weight="bold" color="labelSecondary" style={{ opacity: 0.7 }}>
              {formatNumber(volume, { useOrderSuffix: true, decimals: 1, style: '$' })}
            </Text>
          )}
        </Box>
        <Box
          paddingHorizontal={'12px'}
          backgroundColor={badgeBackgroundColor}
          borderRadius={18}
          height={36}
          justifyContent="center"
          alignItems="center"
          borderWidth={2}
          borderColor={{ custom: opacityWorklet('#FFFFFF', 0.12) }}
          flexDirection="row"
          gap={6}
        >
          <InnerShadow borderRadius={10} color={opacityWorklet(accentColor, 0.24)} blur={2.5} dx={0} dy={1} />
          <Box flexDirection="row" alignItems="center" justifyContent="center" gap={6}>
            <Text size="icon 13px" weight="heavy" color="white">
              {isWinningOutcome ? '􀆅' : '􀆄'}
            </Text>
            <Text size="15pt" weight="heavy" color="white">
              {isWinningOutcome ? i18n.t(i18n.l.predictions.outcomes.yes_badge) : i18n.t(i18n.l.predictions.outcomes.no_badge)}
            </Text>
          </Box>
        </Box>
      </Box>
    </GradientBorderView>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 66,
    marginRight: -4,
    overflow: 'hidden',
  },
  image: {
    height: 40,
    width: 40,
    borderRadius: 9,
  },
  flex: {
    flex: 1,
  },
});
