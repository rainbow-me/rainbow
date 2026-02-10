import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Box, TextIcon, globalColors, useColorMode } from '@/design-system';
import { PolymarketNavigation } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator';
import Routes from '@/navigation/routesNames';
import { opacity } from '@/framework/ui/utils/opacity';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from 'react-native-blur-view';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { IS_IOS } from '@/env';
import { POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

export const PolymarketSearchButton = memo(function PolymarketSearchButton() {
  const { isDarkMode } = useColorMode();

  const lightShadowProps = !isDarkMode ? { backgroundColor: POLYMARKET_BACKGROUND_LIGHT, shadow: '24px' as const } : {};

  return (
    <ButtonPressAnimation onPress={() => PolymarketNavigation.navigate(Routes.POLYMARKET_SEARCH_SCREEN)}>
      <Box
        borderWidth={isDarkMode ? 2 : THICK_BORDER_WIDTH}
        borderColor={{ custom: isDarkMode ? opacity('#DC91F4', 0.06) : globalColors.white100 }}
        justifyContent="center"
        alignItems="center"
        borderRadius={29}
        height={58}
        width={58}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...lightShadowProps}
      >
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.07 : 0.5 }]}
            colors={isDarkMode ? ['#DC91F4', opacity('#DC91F4', 0.5)] : [globalColors.white100, opacity('#F5F5F7', 0)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {isDarkMode && (
            <>
              {IS_IOS ? (
                <BlurView blurIntensity={24} blurStyle={'dark'} style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#190F1C' }]} />
              )}
            </>
          )}
          {isDarkMode && <InnerShadow borderRadius={29} color={opacity('#DC91F4', 0.14)} blur={5} dx={0} dy={1} />}
        </View>
        <TextIcon size="icon 21px" weight="heavy" color={{ custom: isDarkMode ? '#C863E8' : globalColors.grey100 }}>
          {'􀊫'}
        </TextIcon>
      </Box>
    </ButtonPressAnimation>
  );
});
