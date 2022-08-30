import MaskedView from '@react-native-masked-view/masked-view';
import lang from 'i18n-js';
import React, { useCallback, useEffect } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { CustomShadow } from '../../design-system/layout/shadow';
import { useNavigation } from '../../navigation/Navigation';
import { ButtonPressAnimation } from '../animations';
import { enableActionsOnReadOnlyWallet } from '@/config';
import {
  AccentColorProvider,
  Box,
  ColorModeProvider,
  Cover,
  Heading,
  Inset,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { useDimensions, useENSPendingRegistrations, useWallets } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { watchingAlert } from '@/utils';

const CardShadow: CustomShadow = {
  custom: {
    android: {
      color: 'accent',
      elevation: 24,
      opacity: 0.5,
    },
    ios: [
      {
        blur: 24,
        color: 'accent',
        offset: { x: 0, y: 8 },
        opacity: 0.35,
      },
    ],
  },
};

const springConfig = {
  damping: 20,
  mass: 1,
  stiffness: 300,
};

export default function ENSSearchCard() {
  const { width: deviceWidth } = useDimensions();
  const { pendingRegistrations } = useENSPendingRegistrations();
  const { navigate } = useNavigation();
  const { colors } = useTheme();
  const { isReadOnlyWallet } = useWallets();

  const pendingBadgeProgress = useSharedValue(0);

  useEffect(() => {
    if (pendingRegistrations?.length > 0) {
      // This setTimeout prevents the badge from appearing before the number in the badge is updated.
      setTimeout(() => {
        pendingBadgeProgress.value = withSpring(1, springConfig);
      }, 0);
    } else {
      pendingBadgeProgress.value = withSpring(0, springConfig);
    }
  }, [pendingBadgeProgress, pendingRegistrations?.length]);

  const handlePress = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.REGISTER_ENS_NAVIGATOR, {
        fromDiscover: true,
        mode: REGISTRATION_MODES.SEARCH,
      });
    } else {
      watchingAlert();
    }
  }, [isReadOnlyWallet, navigate]);

  const shadow = useForegroundColor('shadow');
  const shadowColor = useForegroundColor({
    custom: {
      dark: shadow,
      light: '#4C79FD',
    },
  });

  const pendingBadgeStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 * pendingBadgeProgress.value,
      transform: [
        {
          scale: 1 * pendingBadgeProgress.value,
        },
      ],
    };
  }, [pendingRegistrations]);

  const searchIconStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 * (1 - pendingBadgeProgress.value),
      transform: [
        {
          scale: 1 * (1 - pendingBadgeProgress.value),
        },
      ],
    };
  }, [pendingRegistrations]);

  return (
    <ButtonPressAnimation
      onPress={handlePress}
      scaleTo={0.9}
      style={
        android && {
          paddingBottom: 19,
          paddingLeft: 9.5,
          paddingRight: 19,
        }
      }
      testID="ens-register-name-banner"
    >
      <AccentColorProvider color={shadowColor}>
        <Box background="body" borderRadius={24} shadow={CardShadow}>
          <ColorModeProvider value="darkTinted">
            <Box
              as={LinearGradient}
              background="body"
              borderRadius={24}
              colors={colors.gradients.ens}
              end={{ x: 1, y: 0.5 }}
              height={{ custom: (deviceWidth - 19 * 3) / 2 }}
              start={{ x: 0, y: 0.5 }}
            >
              <Inset
                bottom={{ custom: 22.5 }}
                horizontal={{ custom: 20 }}
                top={{ custom: 20 }}
              >
                <Box height="full">
                  <Box
                    as={Animated.View}
                    position="absolute"
                    style={pendingBadgeStyle}
                  >
                    <AccentColorProvider color="#5FA9EE">
                      <Box
                        background="accent"
                        borderRadius={20}
                        height={{ custom: 40 }}
                        shadow="12px light"
                        style={{
                          borderColor: '#EDF9FF',
                          borderWidth: 2.5,
                        }}
                        width={{ custom: 40 }}
                      >
                        <Cover alignHorizontal="center" alignVertical="center">
                          <Text align="center" size="20px" weight="heavy">
                            {pendingRegistrations?.length}
                          </Text>
                        </Cover>
                      </Box>
                    </AccentColorProvider>
                  </Box>
                  <Box
                    as={Animated.View}
                    position="absolute"
                    style={searchIconStyle}
                  >
                    <AccentColorProvider color="#3157D3">
                      <Box
                        background="accent"
                        borderRadius={20}
                        height={{ custom: 40 }}
                        shadow="12px light"
                        width={{ custom: 40 }}
                      >
                        <MaskedView
                          maskElement={
                            <Cover
                              alignHorizontal="center"
                              alignVertical="center"
                            >
                              <Text
                                align="center"
                                size="icon 19px"
                                weight="bold"
                              >
                                􀊫
                              </Text>
                            </Cover>
                          }
                          style={{ height: '100%', width: '100%' }}
                        >
                          <Cover
                            alignHorizontal="center"
                            alignVertical="center"
                          >
                            <AccentColorProvider color="#80D4FF">
                              <Box background="accent">
                                <Box
                                  as={LinearGradient}
                                  colors={colors.gradients.white80ToTransparent}
                                  end={{ x: 0.5, y: 1 }}
                                  height={{ custom: 30 }}
                                  start={{ x: 0.5, y: 0 }}
                                  width={{ custom: 30 }}
                                />
                              </Box>
                            </AccentColorProvider>
                          </Cover>
                        </MaskedView>
                      </Box>
                    </AccentColorProvider>
                  </Box>
                  <Box bottom="0px" position="absolute">
                    <Stack space={{ custom: 11 }}>
                      <AccentColorProvider color="#BFDAFF">
                        <Text color="accent" size="14px" weight="bold">
                          {lang.t('discover.ens_search.mini_title')}
                        </Text>
                      </AccentColorProvider>
                      <Heading size="20px" weight="bold">
                        {/* RN seems to treat "a .eth" as a URL and prevents line breaks between "a" and ".eth". &#8203; is a zero width character that allows a line break. */}
                        {lang.t('discover.ens_search.title_part_1')}&#8203;
                        {lang.t('discover.ens_search.title_part_2')}
                      </Heading>
                    </Stack>
                  </Box>
                </Box>
              </Inset>
            </Box>
          </ColorModeProvider>
        </Box>
      </AccentColorProvider>
    </ButtonPressAnimation>
  );
}
