import { StyleSheet, View } from 'react-native';
import { Text, TextShadow } from '@/design-system';
import { LinearGradient } from 'expo-linear-gradient';
import { opacity } from '@/framework/ui/utils/opacity';

const SIZE = 32;
const BORDER_RADIUS = 10;
const OVER_COLOR = '#3ECF5B';
const UNDER_COLOR = '#FF584D';

export function OverUnderIcon({ direction }: { direction: 'over' | 'under' }) {
  const color = direction === 'over' ? OVER_COLOR : UNDER_COLOR;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[opacity(color, 0.12), opacity(color, 0)]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
      <TextShadow blur={40} shadowOpacity={0.6} color={color}>
        <Text size="15pt" weight="heavy" color={{ custom: color }} align="center">
          {direction === 'over' ? '􀄨' : '􀄩'}
        </Text>
      </TextShadow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
