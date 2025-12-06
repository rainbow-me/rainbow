import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Box, TextIcon, useColorMode } from '@/design-system';
import { PolymarketNavigation } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator';
import Routes from '@/navigation/routesNames';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
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
        borderWidth={THICKER_BORDER_WIDTH}
        borderColor={{ custom: opacityWorklet('#DC91F4', 0.03) }}
        justifyContent="center"
        alignItems="center"
        borderRadius={29}
        height={58}
        width={58}
      >
        <View style={StyleSheet.absoluteFill}>
          <BlurView blurIntensity={24} blurStyle={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={[opacityWorklet('#DC91F4', 1), opacityWorklet('#DC91F4', 0.5)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          />
          <InnerShadow borderRadius={29} color={opacityWorklet('#DC91F4', 0.14)} blur={5} dx={0} dy={1} />
        </View>
        <TextIcon size="icon 20px" weight="heavy" color={{ custom: '#C863E8' }}>
          {'􀊫'}
        </TextIcon>
      </Box>
    </ButtonPressAnimation>
  );
});

const styles = StyleSheet.create({
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.19,
  },
});
