import { memo, useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';

import polymarketLogo from '@/assets/polymarketLogo.png';
import { layoutAnimations } from '@/components/animations/animationConfigs';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Text, TextIcon } from '@/design-system';
import { PolymarketButton } from '@/features/polymarket/components/PolymarketButton';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { wrapUsdcBalanceToPusd } from '@/features/polymarket/utils/collateral';
import usdcIcon from '@/features/rnbw-rewards/assets/rnbw-reward-methods/usdc.png';
import { LoadingSpinner } from '@/framework/ui/components/LoadingSpinner';
import { opacity } from '@/framework/ui/utils/opacity';
import { useIsFirstRender } from '@/hooks/useIsFirstRender';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import Navigation from '@/navigation/Navigation';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { checkIfReadOnlyWallet } from '@/state/wallets/walletsStore';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';

const translations = i18n.l.predictions.wrap_collateral;

export const PolymarketConvertCollateralSheet = memo(function PolymarketConvertCollateralSheet() {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_CONVERT_COLLATERAL_SHEET>>();
  const [isWrapping, setIsWrapping] = useState(false);
  const isFirstRender = useIsFirstRender();
  const buttonContentEntering = isFirstRender ? undefined : layoutAnimations.buttonContent.entering;

  const handleSuccess = useCallback(() => {
    Navigation.goBack();
    params?.onSuccess?.();
  }, [params]);

  const handleWrap = useCallback(async () => {
    if (isWrapping) return;
    if (checkIfReadOnlyWallet(usePolymarketClients.getState().address)) return;

    const proxyAddress = usePolymarketClients.getState().proxyAddress;
    if (!proxyAddress) {
      Alert.alert(i18n.t(translations.error_title), i18n.t(translations.error_message));
      return;
    }

    setIsWrapping(true);

    try {
      await wrapUsdcBalanceToPusd(proxyAddress);
      handleSuccess();
    } catch (e) {
      logger.error(new RainbowError('[PolymarketConvertCollateralSheet] Failed to convert collateral', e));
      Alert.alert(i18n.t(translations.error_title), i18n.t(translations.error_message));
      setIsWrapping(false);
    }
  }, [handleSuccess, isWrapping]);

  return (
    <PanelSheet
      handleProps={{ color: opacity('#6C6975', 0.3), showBlur: false, top: 8 }}
      outerBorderWidth={0}
      innerBorderWidth={THICKER_BORDER_WIDTH}
      innerBorderColor={opacity('#FFFFFF', 0.06)}
      panelStyle={styles.panel}
    >
      <LinearGradient
        colors={[opacity('#FFFFFF', 0.096), opacity('#FFFFFF', 0)]}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconRow}>
            <Image source={usdcIcon} style={styles.icon} />
            <TextIcon color="label" size="icon 17px" weight="heavy" opacity={0.2}>
              {'􀰑'}
            </TextIcon>
            <Image source={polymarketLogo} style={styles.icon} />
          </View>

          <View style={styles.copy}>
            <Text color="label" size="26pt" weight="heavy">
              {i18n.t(translations.title)}
            </Text>
            <Text color={'labelTertiary'} size="17pt / 135%" weight="bold">
              {i18n.t(translations.subtitle)}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <PolymarketButton buttonProps={{ disabled: isWrapping }} width="full" onPress={handleWrap}>
            <Animated.View layout={layoutAnimations.buttonContent.layout} style={styles.buttonContentContainer}>
              {isWrapping ? (
                <Animated.View
                  key="wrapping"
                  entering={buttonContentEntering}
                  exiting={layoutAnimations.buttonContent.exiting}
                  layout={layoutAnimations.buttonContent.layout}
                  style={styles.buttonContent}
                >
                  <Box flexDirection="row" alignItems="center" gap={12}>
                    <LoadingSpinner color="#FFFFFF" size={20} />
                    <Text align="center" color="label" size="22pt" weight="heavy">
                      {i18n.t(translations.loading)}
                    </Text>
                  </Box>
                </Animated.View>
              ) : (
                <Animated.View
                  key="idle"
                  entering={buttonContentEntering}
                  exiting={layoutAnimations.buttonContent.exiting}
                  layout={layoutAnimations.buttonContent.layout}
                  style={styles.buttonContent}
                >
                  <Text align="center" color="label" size="22pt" weight="heavy">
                    {i18n.t(translations.button)}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          </PolymarketButton>
        </View>
      </View>
    </PanelSheet>
  );
});

const styles = StyleSheet.create({
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 32,
  },
  content: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 52,
  },
  copy: {
    gap: 20,
  },
  header: {
    gap: 32,
    paddingHorizontal: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  panel: {
    backgroundColor: '#000000',
  },
});
