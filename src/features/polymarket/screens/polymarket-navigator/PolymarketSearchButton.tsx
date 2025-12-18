import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Box, TextIcon, globalColors, useColorMode } from '@/design-system';
import { PolymarketNavigation } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator';
import Routes from '@/navigation/routesNames';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from 'react-native-blur-view';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';

export const PolymarketSearchButton = memo(function PolymarketSearchButton() {
  const { isDarkMode } = useColorMode();

  return (
    <ButtonPressAnimation onPress={() => PolymarketNavigation.navigate(Routes.POLYMARKET_SEARCH_SCREEN)}>
      <Box
        borderWidth={2}
        borderColor={{ custom: isDarkMode ? opacityWorklet('#DC91F4', 0.06) : globalColors.white100 }}
        justifyContent="center"
        alignItems="center"
        borderRadius={29}
        height={58}
        width={58}
      >
        <View style={StyleSheet.absoluteFill}>
          {isDarkMode ? (
            <LinearGradient
              style={[StyleSheet.absoluteFill, { opacity: 0.07 }]}
              colors={['#DC91F4', opacityWorklet('#DC91F4', 0.5)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          ) : (
            <View style={styles.lightModeFill} />
          )}
          <BlurView blurIntensity={24} blurStyle={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <InnerShadow borderRadius={29} color={opacityWorklet('#DC91F4', 0.14)} blur={5} dx={0} dy={1} />
        </View>
        <TextIcon size="icon 21px" weight="heavy" color={{ custom: isDarkMode ? '#C863E8' : globalColors.grey100 }}>
          {'􀊫'}
        </TextIcon>
      </Box>
    </ButtonPressAnimation>
  );
});

const styles = StyleSheet.create({
  lightModeFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});
