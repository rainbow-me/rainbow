import { ButtonPressAnimation } from '@/components/animations';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { GradientText } from '@/components/text';
import { Text, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export const LaunchButton = memo(function LaunchButton() {
  const { isDarkMode } = useColorMode();

  return (
    <View style={styles.launchButtonPosition}>
      <ButtonPressAnimation
        onPress={() => {
          Navigation.handleAction(Routes.TOKEN_LAUNCHER_SCREEN);
        }}
      >
        <View
          style={[
            styles.launchButton,
            {
              shadowColor: isDarkMode ? '#000' : 'rgba(0,0,0,0.4)',
            },
          ]}
        >
          <GradientBorderView
            borderGradientColors={['#FFEB3B', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            borderRadius={28}
            borderWidth={3}
            backgroundColor={'transparent'}
            // leaving inline position styles so its easier to see next to the usage
            style={{
              height: 52,
            }}
          >
            <View style={styles.launchButtonContent}>
              <LinearGradient
                colors={['#EBAF09', '#FFC800']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.launchButtonGradient}
              >
                <View style={styles.launchButtonTextContainer}>
                  <GradientText colors={['#3D1E0A', '#7A600A']}>
                    <Text color="accent" size="icon 18px" weight="black" style={{ marginTop: -1 }}>
                      􀅼
                    </Text>
                  </GradientText>
                  <GradientText colors={['#3D1E0A', '#7A600A']}>
                    <Text color="accent" size="20pt" weight="black" style={{ marginTop: -1 }}>
                      {i18n.t(i18n.l.king_of_hill.launch)}
                    </Text>
                  </GradientText>
                </View>
              </LinearGradient>
            </View>
          </GradientBorderView>
        </View>
      </ButtonPressAnimation>
    </View>
  );
});

const styles = StyleSheet.create({
  launchButtonPosition: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 10,
  },

  launchButton: {
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  // separate from launchButton so overflow hidden doesnt mess up shadow
  launchButtonContent: { borderRadius: 28, overflow: 'hidden', flex: 1 },

  launchButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  launchButtonTextContainer: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25 },
});
