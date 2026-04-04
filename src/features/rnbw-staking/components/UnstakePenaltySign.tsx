import { memo } from 'react';
import { Box, Text, useColorMode, type TextProps } from '@/design-system';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { opacity } from '@/framework/ui/utils/opacity';

type PenaltySignProps = {
  percentage: number;
  signFaceConfig?: {
    width: number;
    height: number;
    borderRadius: number;
    borderWidth: number;
    fontSize: TextProps['size'];
    fontWeight: TextProps['weight'];
  };
  signPostConfig?: {
    width: number;
    height: number;
  };
};

const SIGN_FACE_CONFIG = {
  width: 81,
  height: 58,
  borderRadius: 18,
  borderWidth: 4.33,
  fontSize: '26pt',
  fontWeight: 'heavy',
} as const;

const SIGN_POST_CONFIG = {
  width: 8,
  height: 24,
} as const;

export const UnstakePenaltySign = memo(function UnstakePenaltySign({
  percentage,
  signFaceConfig: signFaceConfig = SIGN_FACE_CONFIG,
  signPostConfig: signPostConfig = SIGN_POST_CONFIG,
}: PenaltySignProps) {
  const { isDarkMode } = useColorMode();
  const signColor = isDarkMode ? 'rgba(255,255,255,0.6)' : '#000000';
  const signFaceColor = isDarkMode ? '#090909' : '#FFFEFC';

  return (
    <View style={styles.container}>
      {/* Sign Face */}
      <Box
        justifyContent="center"
        alignItems="center"
        backgroundColor={signFaceColor}
        borderColor="red"
        borderRadius={signFaceConfig.borderRadius}
        height={signFaceConfig.height}
        width={signFaceConfig.width}
        borderWidth={signFaceConfig.borderWidth}
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
        <Text color="label" size={signFaceConfig.fontSize} weight={signFaceConfig.fontWeight}>
          {`${percentage}%`}
        </Text>
      </Box>
      {/* Sign Post */}
      <LinearGradient
        colors={[signColor, opacity(signColor, 0)]}
        style={{
          width: signPostConfig.width,
          height: signPostConfig.height,
        }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
