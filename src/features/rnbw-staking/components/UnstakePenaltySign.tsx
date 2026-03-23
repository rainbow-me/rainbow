import { memo } from 'react';
import { Box, Text, useColorMode } from '@/design-system';
import { StyleSheet, View } from 'react-native';
import { UNSTAKE_PENALTY_PERCENTAGE } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { opacity } from '@/framework/ui/utils/opacity';

type PenaltySignProps = {
  signFaceConfig?: {
    width: number;
    height: number;
    borderRadius: number;
  };
  signPostConfig?: {
    width: number;
    height: number;
  };
};

export const UnstakePenaltySign = memo(function UnstakePenaltySign({
  signFaceConfig: signFaceConfig = { width: 81, height: 58, borderRadius: 18 },
  signPostConfig: signPostConfig = { width: 8, height: 24 },
}: PenaltySignProps) {
  const { isDarkMode } = useColorMode();
  const signColor = isDarkMode ? '#FFFFFF' : '#000000';

  return (
    <View style={styles.container}>
      {/* Sign Face */}
      <Box
        justifyContent="center"
        alignItems="center"
        backgroundColor="white"
        borderColor="red"
        borderRadius={signFaceConfig.borderRadius}
        height={signFaceConfig.height}
        width={signFaceConfig.width}
        borderWidth={13 / 3}
        shadow={{
          custom: {
            light: {
              ios: [{ x: 0, y: 4, blur: 6, color: 'shadowFar', opacity: 0.14 }],
              android: { elevation: 8, color: 'shadowFar', opacity: 0.7 },
            },
            dark: {
              ios: [{ x: 0, y: 4, blur: 6, color: 'shadowFar', opacity: 0.28 }],
              android: { elevation: 8, color: 'shadowFar', opacity: 1 },
            },
          },
        }}
      >
        <Text color="label" size="26pt" weight="heavy">
          {`${UNSTAKE_PENALTY_PERCENTAGE}%`}
        </Text>
      </Box>
      {/* Sign Post */}
      <LinearGradient
        colors={[signColor, opacity(signColor, 0)]}
        style={{
          width: signPostConfig.width,
          height: signPostConfig.height,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
