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
        borderColor={{ custom: opacityWorklet('#DC91F4', 0.06) }}
        justifyContent="center"
        alignItems="center"
        borderRadius={29}
        height={58}
        width={58}
      >
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={[
              isDarkMode ? '#C863E8' : opacityWorklet('#C863E8', 0.6),
              opacityWorklet(globalColors[isDarkMode ? 'grey100' : 'white100'], 0),
            ]}
            start={{ x: 0, y: isDarkMode ? 0.125 : 0.8 }}
            end={{ x: 0, y: isDarkMode ? 0.8 : 0.125 }}
            style={StyleSheet.absoluteFill}
          />
          <BlurView blurIntensity={24} blurStyle={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <InnerShadow borderRadius={29} color={opacityWorklet('#C863E8', 0.2)} blur={5} dx={0} dy={1} />
        </View>
        <TextIcon size="icon 21px" weight="heavy" color={{ custom: '#C863E8' }}>
          {'􀊫'}
        </TextIcon>
      </Box>
    </ButtonPressAnimation>
  );
});
